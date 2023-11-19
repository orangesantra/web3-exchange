const { ethers } = require("hardhat");

async function main() {
console.log(`Preparing deployment...\n`)
    // Fetch Contract to deploy
    const Token = await ethers.getContractFactory('Token')
    const Exchange = await ethers.getContractFactory('Exchange')

    // Fetch accounts
    const accounts = await ethers.getSigners()
    console.log(`Accounts fetched:\n${accounts[0].address}\n${accounts[1].address}\n`)

    // Deploy Contract

    const dapp = await Token.deploy('Dapp University', 'DAPP', '1000000')
    await dapp.waitForDeployment()
    console.log(`DAPP Deployed to: ${await dapp.getAddress()}`)
  
    const mETH = await Token.deploy('mETH', 'mETH', '1000000')
    await mETH.waitForDeployment()
    console.log(`mETH Deployed to: ${await mETH.getAddress()}`)
  
    const mDAI = await Token.deploy('mDAI', 'mDAI', '1000000')
    await mDAI.waitForDeployment()
    console.log(`mDAI Deployed to: ${await mDAI.getAddress()}`)
  
    const exchange = await Exchange.deploy(accounts[1].address, 10)
    await exchange.waitForDeployment()
    console.log(`Exchange Deployed to: ${await exchange.getAddress()}`)
  
}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


    // const token = await Token.deploy()

    // // Deployed Contract values are stored in the token instance


    // // token.name()
    // // .then((value)=>{
    // //   console.log(`Token name : ${value}`)
    // // })
    // const x = await token.name() // await and promishes are used because fetching from deployed contract also take time
    // console.log(x)
    