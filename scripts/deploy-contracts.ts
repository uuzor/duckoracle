import { ethers } from 'hardhat';

async function main() {
  console.log('Deploying DuckOracle contracts...');

  // Deploy DUCK Token
  const DuckToken = await ethers.getContractFactory('DuckToken');
  const initialSupply = ethers.utils.parseEther('1000000'); // 1M tokens
  const duckToken = await DuckToken.deploy(initialSupply);
  await duckToken.deployed();
  console.log('DuckToken deployed to:', duckToken.address);

  // Deploy ChainGPT Oracle Mock
  const ChainGPTOracleMock = await ethers.getContractFactory('ChainGPTOracleMock');
  const chainGPTOracle = await ChainGPTOracleMock.deploy();
  await chainGPTOracle.deployed();
  console.log('ChainGPTOracleMock deployed to:', chainGPTOracle.address);

  // Deploy DuckOracle
  const DuckOracle = await ethers.getContractFactory('DuckOracle');
  const [deployer] = await ethers.getSigners();
  const duckOracle = await DuckOracle.deploy(
    duckToken.address,
    chainGPTOracle.address,
    deployer.address // Fee recipient
  );
  await duckOracle.deployed();
  console.log('DuckOracle deployed to:', duckOracle.address);

  // Set up oracle connection
  await chainGPTOracle.setDuckOracleContract(duckOracle.address);
  console.log('Oracle connection established');

  // Add DuckOracle as minter for DUCK tokens
  await duckToken.addMinter(duckOracle.address);
  console.log('DuckOracle added as token minter');

  console.log('\nDeployment Summary:');
  console.log('==================');
  console.log('DuckToken:', duckToken.address);
  console.log('ChainGPTOracle:', chainGPTOracle.address);
  console.log('DuckOracle:', duckOracle.address);
  console.log('Deployer:', deployer.address);

  // Verify contracts on block explorer (if needed)
  console.log('\nTo verify contracts, run:');
  console.log(`npx hardhat verify --network <network> ${duckToken.address} ${initialSupply}`);
  console.log(`npx hardhat verify --network <network> ${chainGPTOracle.address}`);
  console.log(`npx hardhat verify --network <network> ${duckOracle.address} ${duckToken.address} ${chainGPTOracle.address} ${deployer.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });