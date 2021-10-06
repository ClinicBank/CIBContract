const Gistcoin = artifacts.require("Gistcoin");
const totalSupply = '500000000000000000000000000' // 500000000 GIST in Wei

module.exports = async (deployer) => {
    await deployer.deploy(Gistcoin, totalSupply)
};
