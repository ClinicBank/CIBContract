const ClinicBank = artifacts.require("ClinicBank");
const totalSupply = '1000000000000000000000000' // 1,000,000 CIB in Wei

module.exports = async (deployer) => {
    await deployer.deploy(ClinicBank, totalSupply)
};
