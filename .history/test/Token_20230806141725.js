const { ethers } = require("hardhat")
const { expect } = require("chai")

// Test isliye use karte taki compilation aur depoyment ek sath kar sake, contract ko manually compile aur phir deploy karne ka jarurat nhi h.

function tokens (n){
    return ethers.parseUnits(n.toString(),'ether')
}


describe('Token', ()=>{

    let token;

    beforeEach(async () => { // hook which is executed before any code provided by mocha, INBUILT
        // Fetch token from blockchain
        const Token = await ethers.getContractFactory('Token');
        token = await Token.deploy('Dapp University', 'DAPP', 1000000);
    });

    describe('Deployment', ()=>{

        it('has correct name', async() =>{
            //Read token name
            const name = await token.name() // token.name() means accesing name from Token contract, in simple it corresponds to Token.sol contract object
            //Check that name is correct
            expect(name).to.equal('Dapp University')
    
        })
    
        it('has correct symbol', async() =>{
            // const symbol = await token.symbolad() ---> it will work exactly fine, the only change we need to do is string public symbolad in Token.sol file
            const symbol = await token.symbol()
            expect(symbol).to.equal('DAPP')
        })  
    
        it('has correct decimal', async() =>{
            const decimal = await token.decimals() 
            expect(decimal).to.equal(18)
        }) 
    
        it('has correct totalSupply', async() =>{
            const value = tokens(1000000)
            // const value = ethers.parseUnits('1000000','ether')
            const ts = await token.totalSupply() 
            expect(ts).to.equal(value)
        }) 
        
    }) 

})