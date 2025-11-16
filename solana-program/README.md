# Product Provenance Solana Program

On-chain Solana program for tracking product lifecycle and ownership.

## Features

- **Product Creation**: Manufacturers can register new products
- **Ownership Transfer**: Secure transfer of ownership with signature verification
- **Repair Records**: Track authorized repairs and maintenance
- **End-of-Life**: Mark products as retired from circulation
- **Chain Verification**: Each record links to previous, creating tamper-resistant chain

## Data Structure

```rust
ProductRecord {
    product_id: String,           // Unique S/N
    transaction_type: Enum,       // Manufacture, Repair, Transfer, EndOfLife
    previous_record: Option<Pubkey>, // Link to previous record
    current_owner: Pubkey,        // Current owner's public key
    next_owner: Option<Pubkey>,   // Next owner (for transfers)
    timestamp: i64,               // Unix timestamp
    metadata: String,             // Additional info (repair details, etc.)
}
```

## Build

```bash
cargo build-sbf
```

## Deploy

```bash
solana program deploy target/deploy/product_provenance.so
```

## Security

- Signature verification for all operations
- Ownership validation before transfers
- Immutable chain of records
- Timestamp verification
