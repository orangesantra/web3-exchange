const { ethers } = require("hardhat")
const { expect } = require("chai")


function tokens (n){
    return ethers.parseUnits(n.toString(),'ether')
}


describe('Token', ()=>{

    let token;
    let deployer;
    let accounts;


    before(async () => {
        const Token = await ethers.getContractFactory('Check');
        token = await Token.deploy('Demo Coin', 'DC', 1000000);
        await token.waitForDeployment()
        console.log('Token Address', await token.getAddress())
        accounts = await ethers.getSigners()
        deployer = accounts[0]; 
    
    });

    describe('Deployment', ()=>{

        
        it('has correct name', async() =>{
            expect(await token.name()).to.equal('Demo Coin')
        })
    
        it('has correct symbol', async() =>{
            expect(await token.symbol()).to.equal('DC')
        })  
    
        it('has correct decimal', async() =>{
            expect(await token.decimals()).to.equal(18)
        }) 
    
        it('has correct totalSupply', async() =>{
            expect(await token.totalSupply() ).to.equal(tokens(1000000))
        }) 

        it('assigns total supply to deployer', async() =>{
           expect(await token.balanceOf(deployer.address)).to.equal(tokens(1000000))
        }) 
        
    }) 


})