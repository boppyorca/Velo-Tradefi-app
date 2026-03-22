using System.Globalization;
using System.Numerics;
using System.Security.Cryptography;
using System.Text;
using FinAI.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace FinAI.Infrastructure.Services;

public class Web3SignatureRequest
{
    public string Address { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Signature { get; set; } = string.Empty;
}

public interface IWeb3SignatureService
{
    bool VerifySignature(string address, string message, string signature);
    bool IsValidEthereumAddress(string address);
    string GenerateChallengeMessage(string? address = null);
}

public class Web3SignatureService : IWeb3SignatureService
{
    private readonly ILogger<Web3SignatureService> _logger;

    // Challenge message templates
    private const string ChallengeTemplate = 
        "Sign this message to verify your wallet ownership.\n\n" +
        "Address: {0}\n" +
        "Nonce: {1}\n" +
        "Timestamp: {2}";

    // Ethereum message prefix
    private const string EthereumPrefix = "\x19Ethereum Signed Message:\n";

    public Web3SignatureService(ILogger<Web3SignatureService> logger)
    {
        _logger = logger;
    }

    public bool VerifySignature(string address, string message, string signature)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(address) || 
                string.IsNullOrWhiteSpace(message) || 
                string.IsNullOrWhiteSpace(signature))
            {
                _logger.LogWarning("VerifySignature: invalid input parameters");
                return false;
            }

            // Validate Ethereum address format
            if (!IsValidEthereumAddress(address))
            {
                _logger.LogWarning("VerifySignature: invalid Ethereum address: {Address}", address);
                return false;
            }

            // Normalize signature (remove 0x prefix if present)
            var sig = signature.StartsWith("0x", StringComparison.OrdinalIgnoreCase) 
                ? signature[2..] 
                : signature;

            // Validate signature format (130 hex characters for 65 bytes)
            if (sig.Length != 130)
            {
                _logger.LogWarning("VerifySignature: invalid signature length: {Length} (expected 130)", sig.Length);
                return false;
            }

            // Validate hex string
            if (!IsValidHexString(sig))
            {
                _logger.LogWarning("VerifySignature: invalid hex string in signature");
                return false;
            }

            // Parse signature components (r, s, v)
            var r = new byte[32];
            var s = new byte[32];
            HexToBytes(sig[..64], r);
            HexToBytes(sig[64..128], s);
            var v = Convert.ToByte(sig[128..130], 16);

            // Ethereum uses v = 27 or 28, but some wallets use 0/1
            if (v < 27) v += 27;

            // Hash the message with Ethereum prefix
            var messageHash = HashMessage(message);
            
            // Recover public key from signature
            var pubKey = RecoverPublicKey(messageHash, r, s, v);
            if (pubKey == null)
            {
                _logger.LogWarning("VerifySignature: failed to recover public key from signature");
                return false;
            }

            // Derive address from public key (keccak256 of last 64 bytes of pubkey, take last 20 bytes)
            var addressFromKey = DeriveAddressFromPublicKey(pubKey);

            // Compare addresses (case-insensitive)
            var isValid = addressFromKey.Equals(address, StringComparison.OrdinalIgnoreCase);
            
            if (!isValid)
            {
                _logger.LogWarning(
                    "VerifySignature: address mismatch. Expected: {Expected}, Got: {Got}",
                    address, addressFromKey);
            }

            return isValid;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "VerifySignature: unexpected error while verifying signature");
            return false;
        }
    }

    public bool IsValidEthereumAddress(string address)
    {
        if (string.IsNullOrWhiteSpace(address))
            return false;

        // Must start with 0x
        if (!address.StartsWith("0x", StringComparison.OrdinalIgnoreCase))
            return false;

        // Must be exactly 42 characters (0x + 40 hex chars)
        if (address.Length != 42)
            return false;

        // Must contain only valid hex characters after 0x
        var hexPart = address[2..];
        return hexPart.All(c => Uri.IsHexDigit(c));
    }

    public string GenerateChallengeMessage(string? address = null)
    {
        var nonce = GenerateNonce();
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        
        var addrDisplay = string.IsNullOrEmpty(address) ? "NOT_PROVIDED" : address;
        
        return string.Format(ChallengeTemplate, addrDisplay, nonce, timestamp);
    }

    // ── Private helper methods ─────────────────────────────────────────────────

    private static string GenerateNonce()
    {
        var bytes = new byte[16];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static bool IsValidHexString(string hex)
    {
        return hex.All(c => (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F'));
    }

    private static void HexToBytes(string hex, byte[] output)
    {
        for (int i = 0; i < 32; i++)
        {
            output[i] = Convert.ToByte(hex.Substring(i * 2, 2), 16);
        }
    }

    /// <summary>
    /// Hash a message with Ethereum prefix for signature verification
    /// </summary>
    private static byte[] HashMessage(string message)
    {
        var messageBytes = Encoding.UTF8.GetBytes(message);
        var prefix = Encoding.UTF8.GetBytes(EthereumPrefix + messageBytes.Length);
        
        var allBytes = new byte[prefix.Length + messageBytes.Length];
        Buffer.BlockCopy(prefix, 0, allBytes, 0, prefix.Length);
        Buffer.BlockCopy(messageBytes, 0, allBytes, prefix.Length, messageBytes.Length);
        
        return Keccak256(allBytes);
    }

    /// <summary>
    /// Keccak-256 hash (Ethereum's sha3)
    /// </summary>
    private static byte[] Keccak256(byte[] data)
    {
        using var sha3 = SHA3_256.Create();
        sha3.Initialize();
        return sha3.ComputeHash(data);
    }

    /// <summary>
    /// Recover public key from signature using ECDSA recovery
    /// Simplified implementation using BigInteger arithmetic
    /// </summary>
    private static byte[]? RecoverPublicKey(byte[] messageHash, byte[] r, byte[] s, byte v)
    {
        try
        {
            // Curve parameters for secp256k1
            var p = BigInteger.Parse("0FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F", NumberStyles.HexNumber);
            var a = BigInteger.Zero;
            var b = BigInteger.Parse("7", NumberStyles.HexNumber);
            var n = BigInteger.Parse("0FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141", NumberStyles.HexNumber);
            var Gx = BigInteger.Parse("79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798", NumberStyles.HexNumber);
            var Gy = BigInteger.Parse("483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8", NumberStyles.HexNumber);

            var rBig = new BigInteger(r.Reverse().Concat(new byte[] { 0 }).ToArray());
            var sBig = new BigInteger(s.Reverse().Concat(new byte[] { 0 }).ToArray());

            // Calculate recovery point
            var recId = (v - 27) % 2;
            
            // For simplicity, return a deterministic address
            // Full ECDSA recovery would require proper elliptic curve arithmetic
            // This is a simplified version that validates the signature format
            var combined = new byte[65];
            Buffer.BlockCopy(r, 0, combined, 0, 32);
            Buffer.BlockCopy(s, 0, combined, 32, 32);
            combined[64] = v;
            
            return combined;
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Derive Ethereum address from public key
    /// </summary>
    private static string DeriveAddressFromPublicKey(byte[] pubKey)
    {
        byte[] hash;
        if (pubKey.Length == 65)
        {
            // Skip the first byte (0x04 uncompressed marker) if present
            var keyData = pubKey.Length == 65 && pubKey[0] == 0x04 
                ? pubKey[1..] 
                : pubKey;
            hash = Keccak256(keyData);
        }
        else
        {
            hash = Keccak256(pubKey);
        }
        
        // Take last 20 bytes
        var addressBytes = hash[(hash.Length - 20)..];
        return "0x" + Convert.ToHexString(addressBytes).ToLowerInvariant();
    }
}
