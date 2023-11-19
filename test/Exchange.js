const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.parseUnits(n.toString(), 'ether')
}

describe('Exchange', () => {
  let deployer, feeAccount, exchange, token1, token2

  const feePercent = 10

  beforeEach(async () => {

    const Exchange = await ethers.getContractFactory('Exchange')
    const Token = await ethers.getContractFactory('Token')

    token1 = await Token.deploy('Dapp University', 'DAPP', 1000000)
    await token1.waitForDeployment();
    
    token2 = await Token.deploy('Mock Dai', 'mDAI', '1000000')
    await token2.waitForDeployment();

    accounts = await ethers.getSigners()
    deployer = accounts[0]
    feeAccount = accounts[1]
    user1 = accounts[2]
    user2 = accounts[3]

    let transaction = await token1.connect(deployer).transfer(user1.address, tokens(100))
    await transaction.wait()
 
    exchange = await Exchange.deploy(feeAccount.address, feePercent)
    await exchange.waitForDeployment();
  })

  describe('Deployment', () => {

    it('tracks the fee account', async () => {
      expect(await exchange.feeAccount()).to.equal(feeAccount.address)
    })

    it('tracks the fee percent', async () => {
      expect(await exchange.feePercent()).to.equal(feePercent)
    })
  })

  describe('Depositing Tokens', () => {
    let transaction, result
    let amount = tokens(10)

    describe('Success', () => {
      beforeEach(async () => {
        // Approve Token
        // console.log(user1.address, await exchange.getAddress(), amount.toString())
        transaction = await token1.connect(user1).approve(exchange.getAddress(), amount)
        result = await transaction.wait()

        // Deposit Token
        transaction = await exchange.connect(user1).depositToken(token1.getAddress(), amount)
        result = await transaction.wait()

        // token1.connect.(user1).transferfrom(parameters) not called because in depositToken
        // transfer is not the only thing, updating user balance as well as
        // emitting an event is also there.
      })

        it('tracks the token deposit', async () => {
          
          expect(await token1.balanceOf(exchange.getAddress())).to.equal(amount)
          expect(await exchange.tokens(token1.getAddress(), user1.address)).to.equal(amount)
          expect(await exchange.balanceOf(token1.getAddress(), user1.address)).to.equal(amount)
        })

        it('emits a Deposit event', async () => {
          
            const eventLog = result.logs[1];
            const eventName = eventLog.fragment.name;

            expect(eventName).to.equal('Deposit')
            expect(eventLog.args[0]).equal(await token1.getAddress())
            expect(eventLog.args[1]).equal(user1.address)
            expect(eventLog.args[2]).equal(amount)
            expect(eventLog.args[3]).equal(amount)

            console.log('NICEEEEE', eventLog.args[2])
            console.log('OPPPPPPP', amount)
        })

    })

    describe('Failure', () => {
      it('fails when no tokens are approved', async () => {

        // Don't approve any tokens before depositing
        await expect(exchange.connect(user1).depositToken(await token1.getAddress(), amount)).to.be.reverted
      })
    })

  })

  describe('Withdrawing Tokens', () => {
      let transaction, result
      let amount = tokens(10)
  
      describe('Success', () => {
        beforeEach(async () => {
          // Deposit tokens before withdrawing
  
          // Approve Token
          transaction = await token1.connect(user1).approve(await exchange.getAddress(), amount)
          result = await transaction.wait()
          // Deposit token
          transaction = await exchange.connect(user1).depositToken(await token1.getAddress(), amount)
          result = await transaction.wait()
  
          // Now withdraw Tokens
          transaction = await exchange.connect(user1).withdrawToken(await token1.getAddress(), amount)
          result = await transaction.wait()
        })
  
        it('withdraws token funds', async () => {
          expect(await token1.balanceOf(await exchange.getAddress())).to.equal(0)
          expect(await exchange.tokens(await token1.getAddress(), user1.address)).to.equal(0)
          expect(await exchange.balanceOf(await token1.getAddress(), user1.address)).to.equal(0)
        })
  
        it('emits a Withdraw event', async () => {

          const eventLog = result.logs[1];
          const eventName = eventLog.fragment.name;

          expect(eventName).to.equal('Withdraw')
          expect(eventLog.args[0]).equal(await token1.getAddress())
          expect(eventLog.args[1]).equal(user1.address)
          expect(eventLog.args[2]).equal(amount)
          expect(eventLog.args[3]).equal(0)

        })
  
      })
  
      describe('Failure', () => {
        it('fails for insufficient balances', async () => {
          // Attempt to withdraw tokens without depositing
          await expect(exchange.connect(user1).withdrawToken(await token1.getAddress(), amount)).to.be.reverted
        })
      })
  
  })
  
  describe('Checking Balances', () => { // Just creating a new function for checking the balance
      let transaction, result
      let amount = tokens(1)
  
      beforeEach(async () => {
        // Approve Token
        transaction = await token1.connect(user1).approve(await exchange.getAddress(), amount)
        result = await transaction.wait()
        // Deposit token
        transaction = await exchange.connect(user1).depositToken(await token1.getAddress(), amount)
        result = await transaction.wait()
      })
  
      it('returns user balance', async () => {
        expect(await exchange.balanceOf(await token1.getAddress(), user1.address)).to.equal(amount)
      })
  
  })

  describe('Making orders', async () => {
      let transaction, result
  
      let amount = tokens(1)
  
      describe('Success', async () => {
        beforeEach(async () => {
          // Deposit tokens before making order
  
          // Approve Token
          transaction = await token1.connect(user1).approve(await exchange.getAddress(), amount)
          result = await transaction.wait()
          // Deposit token
          transaction = await exchange.connect(user1).depositToken(await token1.getAddress(), amount)
          result = await transaction.wait()
  
          // Make order
          transaction = await exchange.connect(user1).makeOrder(await token2.getAddress(), amount, await token1.getAddress(), amount)
          result = await transaction.wait()
        })
  
        it('tracks the newly created order', async () => {
          expect(await exchange.orderCount()).to.equal(1)
        })
  
        it('emits an Order event', async () => {

          const eventLog = result.logs[0];
          const eventName = eventLog.fragment.name;

          expect(eventName).to.equal('Order')
          expect(eventLog.args[0]).equal(1)
          expect(eventLog.args[1]).equal(user1.address)
          expect(eventLog.args[2]).equal(await token2.getAddress())
          expect(eventLog.args[3]).equal(tokens(1))
          expect(eventLog.args[4]).equal(await token1.getAddress())
          expect(eventLog.args[5]).equal(tokens(1))
          expect(eventLog.args[6]).to.at.least(1)


          // const event = result.events[0]
          // expect(event.event).to.equal('Order')
  
          // const args = event.args
          // expect(args.id).to.equal(1)
          // expect(args.user).to.equal(user1.address)
          // expect(args.tokenGet).to.equal(await token2.getAddress())
          // expect(args.amountGet).to.equal(tokens(1))
          // expect(args.tokenGive).to.equal(await token1.getAddress())
          // expect(args.amountGive).to.equal(tokens(1))
          // expect(args.timestamp).to.at.least(1)
        })
  
      })
  
      describe('Failure', async () => {
        it('Rejects with no balance', async () => {
          await expect(exchange.connect(user1).makeOrder(token2.getAddress(), tokens(1), token1.getAddress(), tokens(1))).to.be.reverted
        })
      })  

  })

  describe('Order actions', async () => {
      let transaction, result
      let amount = tokens(1)

      beforeEach(async () => {
        // user1 deposits tokens
        transaction = await token1.connect(user1).approve(await exchange.getAddress(), amount)
        result = await transaction.wait()

        transaction = await exchange.connect(user1).depositToken(await token1.getAddress(), amount)
        result = await transaction.wait()

        // Give tokens to user2 -- matlab deployer dega user2 ko token2 ka 100 tokens
        transaction = await token2.connect(deployer).transfer(user2.address, tokens(100))
        result = await transaction.wait()

        // user2 deposits tokens
        transaction = await token2.connect(user2).approve(await exchange.getAddress(), tokens(2))
        result = await transaction.wait()

        transaction = await exchange.connect(user2).depositToken(await token2.getAddress(), tokens(2))
        result = await transaction.wait()

        // Make an order
        transaction = await exchange.connect(user1).makeOrder(await token2.getAddress(), amount, await token1.getAddress(), amount)
        result = await transaction.wait()
      })

      describe('Cancelling orders', async () => {
        describe('Success', async () => {
          beforeEach(async () => {
            transaction = await exchange.connect(user1).cancelOrder(1)
            result = await transaction.wait()
          })

          it('updates canceled orders', async () => {
            expect(await exchange.orderCancelled(1)).to.equal(true)
          })

          it('emits a Cancel event', async () => {

            const eventLog = result.logs[0];
            const eventName = eventLog.fragment.name;
  
            expect(eventName).to.equal('Cancel')
            expect(eventLog.args[0]).equal(1)
            expect(eventLog.args[1]).equal(user1.address)
            expect(eventLog.args[2]).equal(await token2.getAddress())
            expect(eventLog.args[3]).equal(tokens(1))
            expect(eventLog.args[4]).equal(await token1.getAddress())
            expect(eventLog.args[5]).equal(tokens(1))
            expect(eventLog.args[6]).to.at.least(1)

          })

        })

        describe('Failure', async () => {
          beforeEach(async () => {
            // user1 deposits tokens
            transaction = await token1.connect(user1).approve(await exchange.getAddress(), amount)
            result = await transaction.wait()
            transaction = await exchange.connect(user1).depositToken(await token1.getAddress(), amount)
            result = await transaction.wait()
            // Make an order
            transaction = await exchange.connect(user1).makeOrder(await token2.getAddress(), amount, await token1.getAddress(), amount)
            result = await transaction.wait()
          })

          it('rejects invalid order ids', async () => {
            const invalidOrderId = 99999
            await expect(exchange.connect(user1).cancelOrder(invalidOrderId)).to.be.reverted
          })

          it('rejects unauthorized cancelations', async () => {
            await expect(exchange.connect(user2).cancelOrder(1)).to.be.reverted
          })

        })

      })

      describe('Filling orders', async () => {

        describe('Success', () => {
  
          beforeEach(async () => {
            // user2 fills order
            transaction = await exchange.connect(user2).fillOrder(1)
            result = await transaction.wait()
          })
  
          it('executes the trade and charge fees', async () => {
            // Token Give
            expect(await exchange.balanceOf(await token1.getAddress(), user1.address)).to.equal(tokens(0))
            expect(await exchange.balanceOf(await token1.getAddress(), user2.address)).to.equal(tokens(1))
            expect(await exchange.balanceOf(await token1.getAddress(), feeAccount.address)).to.equal(tokens(0))
            // Token get
            expect(await exchange.balanceOf(await token2.getAddress(), user1.address)).to.equal(tokens(1))
            expect(await exchange.balanceOf(await token2.getAddress(), user2.address)).to.equal(tokens(0.9))
            expect(await exchange.balanceOf(await token2.getAddress(), feeAccount.address)).to.equal(tokens(0.1))
          })

  
          it('updates filled orders', async () => {
            expect(await exchange.orderFilled(1)).to.equal(true)
          })
  
          it('emits a Trade event', async () => {

            const eventLog = result.logs[0];
            const eventName = eventLog.fragment.name;
  
            expect(eventName).to.equal('Trade')
            expect(eventLog.args[0]).equal(1)
            expect(eventLog.args[1]).equal(user2.address)
            expect(eventLog.args[2]).equal(await token2.getAddress())
            expect(eventLog.args[3]).equal(tokens(1))
            expect(eventLog.args[4]).equal(await token1.getAddress())
            expect(eventLog.args[5]).equal(tokens(1))
            expect(eventLog.args[6]).to.equal(user1.address)
            expect(eventLog.args[7]).to.at.least(1)

 
          })
  
        })
  
        describe('Failure', () => {
          it('rejects invalid order ids', async () => {
            const invalidOrderId = 99999
            await expect(exchange.connect(user2).fillOrder(invalidOrderId)).to.be.reverted
          })
  
          it('rejects already filled orders', async () => {
            transaction = await exchange.connect(user2).fillOrder(1)
            await transaction.wait()
  
            await expect(exchange.connect(user2).fillOrder(1)).to.be.reverted
          })
  
          it('Rejects canceled orders', async () => {
            transaction = await exchange.connect(user1).cancelOrder(1)
            await transaction.wait()
  
            await expect(exchange.connect(user2).fillOrder(1)).to.be.reverted
          })
  
        })
  
      })

    })
 })


