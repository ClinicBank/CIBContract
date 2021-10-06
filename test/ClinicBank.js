const Web3 = require('web3')
const ClinicBank = artifacts.require("ClinicBank");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
function toWei(coins) {
    return Web3.utils.toWei(coins.toString(), 'ether')
}

function fromWei(coins) {
    return Web3.utils.fromWei(coins.toString(), 'ether').toString()
}


contract("ClinicBank", (accounts) => {
    let tokenInstance;

    it('initializes the contract with correct values', () => {
        return ClinicBank.deployed()
            .then(instance => {
                tokenInstance = instance
                return tokenInstance.name()
            }).then(name => {
                assert.equal(name, 'ClinicBank', 'has the correct token name')
                return tokenInstance.symbol()
            }).then(symbol => {
                assert.equal(symbol, 'CIB', 'has the correct token symbol')
                return tokenInstance.standard()
            }).then(standard => {
                assert.equal(standard, 'CIB v1.0', 'has the correct token standard')
            })
    });

    it("sets total supply upon deployment", () => {
        return ClinicBank.deployed()
            .then(instance => {
                tokenInstance = instance;
                return tokenInstance.totalSupply();
            }).then(totalSupply => {
                assert.equal(totalSupply.toNumber(), toWei(1000000), 'sets the total supply to 500,000,000')
                return tokenInstance.balanceOf(accounts[0])
            }).then(adminBalance => {
                assert.equal(adminBalance.toNumber(), toWei(1000000), 'it allocates initial supply to admin account')
            })
    });

    it('transfers coin ownership', () => {
        return ClinicBank.deployed()
            .then(instance => {
                tokenInstance = instance
                return tokenInstance.transfer.call(accounts[1], toWei(100000000))
            }).then(assert.fail).catch(error => {
                assert(error.message.indexOf('revert') >= 0, 'error message must contain revert')
                return tokenInstance.transfer.call(accounts[1], toWei(1000), { from: accounts[0] })
            }).then(success => {
                assert.equal(success, true, 'transfer returns true')
                return tokenInstance.transfer(accounts[1], toWei(1000), { from: accounts[0] })
            }).then(receipt => {
                assert.equal(receipt.logs.length, 1, 'triggers one event')
                assert.equal(receipt.logs[0].event, 'Transfer', 'should fire the "Transfer" event')
                assert.equal(receipt.logs[0].args._from, accounts[0], 'logs the account the tokens are transfered from')
                assert.equal(receipt.logs[0].args._to, accounts[1], 'logs the account the tokens are transfered to')
                assert.equal(receipt.logs[0].args._value.toNumber(), toWei(1000), 'logs the transfer amount')
                return tokenInstance.balanceOf(accounts[1])
            }).then(balance => {
                assert.equal(balance.toNumber(), toWei(1000), 'it adds the amount to the receiving account')
                return tokenInstance.balanceOf(accounts[0])
            }).then(balance => {
                assert.equal(balance.toNumber(), toWei(999000), 'deducts the amount from the sending account')
            })
    });

    it('approves GIST coins for delegate transfer', () => {
        return ClinicBank.deployed()
            .then(instance => {
                tokenInstance = instance
                fromAccount = accounts[2];
                toAccount = accounts[3];
                spendingAccount = accounts[4];

                // Transfer some tokens to fromAccount from the adminAccount
                return tokenInstance.transfer(fromAccount, toWei(100), { from: accounts[0] })
            }).then((receipt) => tokenInstance.approve(spendingAccount, toWei(10), { from: fromAccount }))
            // Try transfering something larger than the spender's balance
            .then(receipt => {
                return tokenInstance.transferFrom(fromAccount, toAccount, toWei(9999), { from: spendingAccount })
            })
            .then(assert.fail).catch((error) => {
                assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than the balance')
                // Try tranfering something larger than the approved amount
                return tokenInstance.transferFrom(fromAccount, toAccount, toWei(20), { from: spendingAccount })
            }).then(assert.fail).catch((error) => {
                assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than the approved amount')
                return tokenInstance.transferFrom.call(fromAccount, toAccount, toWei(10), { from: spendingAccount })
            }).then(success => {
                assert.equal(success, true)
                return tokenInstance.transferFrom(fromAccount, toAccount, toWei(10), { from: spendingAccount })
            }).then(receipt => {
                assert.equal(receipt.logs.length, 1, 'triggers one event')
                assert.equal(receipt.logs[0].event, 'Transfer', 'should fire the "Transfer" event')
                assert.equal(receipt.logs[0].args._from, fromAccount, 'logs the account the tokens are transfered from')
                assert.equal(receipt.logs[0].args._to, toAccount, 'logs the account the tokens are transfered to')
                assert.equal(receipt.logs[0].args._value, toWei(10), 'logs the transfer amount')
                return tokenInstance.balanceOf(fromAccount)
            }).then(balance => {
                assert.equal(balance.toNumber(), toWei(90), 'deducts from the from account')
                return tokenInstance.balanceOf(toAccount)
            }).then(balance => {
                assert.equal(balance.toNumber(), toWei(10), 'adds to the receiving account')
                return tokenInstance.allowance(fromAccount, spendingAccount)
            }).then(allowance => {
                assert.equal(allowance.toNumber(), 0, 'deducts the amount from the allowance')
            })
    });
});
