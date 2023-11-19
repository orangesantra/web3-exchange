const { ethers } = require("hardhat")
const { expect } = require("chai")

// Test isliye use karte taki compilation aur depoyment ek sath kar sake, contract ko manually compile aur phir deploy karne ka jarurat nhi h.

function tokens (n){
    return ethers.parseUnits(n.toString(),'ether')
}


describe('Token', ()=>{

    let token;
    let deployer;
    let accounts;
    let reciver;
    let exchange;

    beforeEach(async () => { // hook which is executed before any code provided by mocha, INBUILT
        // Fetch token from blockchain
        const Token = await ethers.getContractFactory('Token');
        token = await Token.deploy('Dapp University', 'DAPP', 1000000);
        // console.log(token.runner.address)
        accounts = await ethers.getSigners()
        deployer = accounts[0]; // get the first account of node.
        // console.log('Deployer   ', deployer)
        // console.log('Deployer Address   ', deployer.address)
        reciver = accounts[1];
        exchange = accounts[2]
    });

    describe('Deployment', ()=>{

        it('has correct name', async() =>{
            expect(await token.name()).to.equal('Dapp University')
        })
    
        it('has correct symbol', async() =>{
            expect(await token.symbol()).to.equal('DAPP')
        })  
    
        it('has correct decimal', async() =>{
            expect(await token.decimals()).to.equal(18)
        }) 
    
        it('has correct totalSupply', async() =>{
            const value = tokens(1000000)
            // const value = ethers.parseUnits('1000000','ether')
            const ts = await token.totalSupply() 
            expect(ts).to.equal(value)
        }) 

        it('assigns total supply to deployer', async() =>{
           expect(await token.balanceOf(deployer.address)).to.equal(tokens(1000000))
        }) // it means check wheather value of key (deployer.address) equals totalSupply of Tokens.
        
    }) 

    describe('Sending Tokens',()=>{

        describe('Success', ()=>{
            let amount, transaction, result;
    
            beforeEach(async()=>{
                amount = tokens(100);
                transaction = await token.connect(deployer).transfer(reciver.address,amount) // transaction ek object instance h
                // jab tranfer function ko execute karte h, par transaction block me bhjne ke bad ye bhi ho sakta
                // ki transaction/function abhi tak mine na hua ho
                result = await transaction.wait(); // toh yha pe result use hota, jab transaction mined ho jata h block
                // ke andar to transaction recipt milta h,jo ki finalized state hota, aur ye jayada information deta as
                // compared to transaction
                
                // That's why transaction.logs[0] doesn't works but result.logs[0] works, because EventLog array in the 
                // case of transaction.logs[0] is empty or null, so calling transaction.logs[0] will result in error
                // and in case of result.logs[0] EventLog array will not be empty because it gives finalized output of events
                // after block minining means transction mining and function mining subsequently.
    
                // EventLog basicaaly gives array putput after mining of block followed by transaction followed by function
                // inside contract is mined.
    
            })
    
            it('Transfer token balance',async() =>{ // agar it ke andar koi parameter nhi rhega tb test by default pass hoga
                expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900))
                expect(await token.balanceOf(reciver.address)).to.equal(amount)
    
            })
    
            it('Emits a transfer event',()=>{
    
    
                const eventLog = result.logs[0]; // Assuming this is the first log in the array
                const eventName = eventLog.fragment.name; // Get the name property from EventFragment
    
    
                expect(eventName).to.equal('Transfer')
                expect(eventLog.args[0]).equal(deployer.address)
                expect(eventLog.args[1]).equal(reciver.address)
                expect(eventLog.args[2]).equal(amount)
                
                // console.log('Event Name:', eventName); // Output: "Event Name: Transfer"
                // console.log(eventLog);
                // console.log('Without ZERO  ',result.logs)
                // console.log('With ZERO  ',result.logs[0]) // More info about index position, more described
                // console.log('With ZERO  ',result.logs[544]) only one index is available
            })
       
        })

        describe('Failure',()=>{

            it('Rejects Insufficeient balance',async()=>{
                const inavlidammount = tokens(100000000)
                await expect(token.connect(deployer).transfer(reciver.address,inavlidammount)).to.be.reverted
            })

            it('Invalid Address',async()=>{
                const amount = tokens(100)
                await expect (token.connect(deployer).transfer('0x0000000000000000000000000000000000000000',amount)).to.be.reverted
            })
    
        })

    })

    

    describe('Approving Tokens', () => {
        let amount, transaction, result
    
        beforeEach(async () => {
          amount = tokens(100)
          transaction = await token.connect(deployer).approve(exchange.address, amount)
          // this is writing on blockchain
          result = await transaction.wait()
        })
    
        describe('Success', () => {
          it('allocates an allowance for delegated token spending', async () => {
            expect(await token.allowance(deployer.address, exchange.address)).to.equal(amount)
          // this is reading from blockchain
          })
    
          it('emits an Approval event', async () => {

            const eventLog = result.logs[0]; // Assuming this is the first log in the array
            const eventName = eventLog.fragment.name; // Get the name property from EventFragment

            expect(eventName).to.equal('Approval')
            expect(eventLog.args[0]).equal(deployer.address)
            expect(eventLog.args[1]).equal(exchange.address)
            expect(eventLog.args[2]).equal(amount)

          })
    
        })
    
        describe('Failure', () => {
          it('rejects invalid spenders', async () => {
            await expect(token.connect(deployer).approve('0x0000000000000000000000000000000000000000', amount)).to.be.reverted
          })
        })
    
      })

      describe('Delegated Token Transfers', () => {
        let amount, transaction, result
    
        beforeEach(async () => {
          amount = tokens(100)
          transaction = await token.connect(deployer).approve(exchange.address, amount)
          result = await transaction.wait()
        })
    
        describe('Success', () => {
          beforeEach(async () => {
            transaction = await token.connect(exchange).transferFrom(deployer.address, reciver.address, amount)
            result = await transaction.wait()
          })
    
          it('transfers token balances', async () => {
            expect(await token.balanceOf(deployer.address)).to.be.equal(ethers.parseUnits('999900', 'ether'))
            expect(await token.balanceOf(reciver.address)).to.be.equal(amount)
          })
    
          it('resets the allowance', async () => {
            expect(await token.allowance(deployer.address, exchange.address)).to.be.equal(0)
          })
    
          it('emits a Transfer event', async () => {
            const eventLog = result.logs[0]; // Assuming this is the first log in the array
            const eventName = eventLog.fragment.name; // Get the name property from EventFragment

            expect(eventName).to.equal('Transfer')
            expect(eventLog.args[0]).equal(deployer.address)
            expect(eventLog.args[1]).equal(reciver.address)
            expect(eventLog.args[2]).equal(amount)
          })
    
        })
    
        describe('Failure', async () => {
          // Attempt to transfer too many tokens
          const invalidAmount = tokens(100000000) // 100 Million, greater than total supply
          await expect(token.connect(exchange).transferFrom(deployer.address, reciver.address, invalidAmount)).to.be.reverted
        })
    
      })

})