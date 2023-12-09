require('@nomiclabs/hardhat-waffle');
require('dotenv').config();
require('solidity-coverage');



module.exports = {
  solidity: {
    version: '0.8.20',
  },
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
