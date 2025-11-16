When a product is created, the company will generate a block tied to a S/N

Whenever the product is repaired or ownership is transferred, this is appended to the blockchain (and even more transactions can be included, such as QC checks and movement from warehouse to retail store) and when the product reaches end of life/sale to a non-participant, this is recorded as well.

What this doesn’t solve:
Theft and sale of stolen goods to parties who are willing to buy stolen goods

Useful because:
Tamper resistant
Allows companies to use existing general-purpose infrastructure instead of developing their own bespoke solution
Increases the complexity required to sell counterfeit goods
Provenance for second-hand resale
"Selling your textbooks, bikes, or electronics? Prove you're the legit owner and it's not stolen. Buyers pay more for verified items."
"If your laptop is stolen, the thief can't transfer ownership without your signature. It's marked as potentially stolen on-chain."
"Show that your phone screen was replaced at an authorized shop, not some sketchy kiosk. Increases resale value."
Similar to CarFax, though there isn’t a widely adopted platform yet.
Reduces return fraud for retailers

Architecture:
Solana account for each product in this format:
Block data {
Unique Product ID
Transaction type
Link to previous record
Current owner’s public key
Next owner’s public key
Timestamp
}

When any node receives a block, it verifies that the signature is valid by decrypting the hash of the block data using the public key and comparing it to the hash of the block data. They also check that the current owner public key is equal to the previous block’s next owner public key.

Creators/manufacturers are responsible for storing their own public key.


### Gemini Wallet SDK
**Use for:** Consumer/retailer wallet management

- Handles key generation and storage for end users
- Users don't need to understand crypto—just "accept transfer"
- Custodial option reduces friction for non-crypto-native users

On-chain Solana program
On-chain Solana account for each product
Off chain: Manufacturer UI Website, Backend/API for Website that communicates with program

Start with Alpine Linux docker image
Dockerize webserver for website
Dockerize backend/api in its own container
Use Trivy for scanning in Docker
Can add security testing to CI/CD later
Use cosign/sigstore in GitHub Actions
