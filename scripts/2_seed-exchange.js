const config = require('../src/config.json')

const tokens = (n) => {
  return ethers.parseUnits(n.toString(), 'ether')
}

const wait = (seconds) => {
  const milliseconds = seconds * 1000
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function main() {
  // Fetch accounts from wallet - these are unlocked
  const accounts = await ethers.getSigners()

  // Fetch network
  const { chainId } = await ethers.provider.getNetwork()
  console.log("Using chainId:", chainId)

  // Fetch deployed tokens
  const DApp = await ethers.getContractAt('Token', config[chainId].DApp.address)
  console.log(`Dapp Token fetched: ${await DApp.getAddress()}\n`)

  const mETH = await ethers.getContractAt('Token', config[chainId].mETH.address)
  console.log(`mETH Token fetched: ${await mETH.getAddress()}\n`)

  const mDAI = await ethers.getContractAt('Token', config[chainId].mDAI.address)
  console.log(`mDAI Token fetched: ${await mDAI.getAddress()}\n`)

  // Fetch the deployed exchange
  const exchange = await ethers.getContractAt('Exchange', config[chainId].exchange.address)
  console.log(`Exchange fetched: ${await exchange.getAddress()}\n`)

  // Give tokens to account[1]
  const sender = accounts[0]
  const receiver = accounts[1]
  let amount = tokens(10000)

  // accounts[0] is contract owner of all tokens, i.e. mETH and DApp, so it can transfer token to other accounts.

  // user1 transfers 10,000 mETH...
  let transaction, result
  transaction = await mETH.connect(sender).transfer(receiver.address, amount)
  console.log(`Transferred ${amount} tokens from ${sender.address} to ${receiver.address}\n`)

  // Set up exchange users
  const user1 = accounts[0]
  const user2 = accounts[1]
  amount = tokens(10000)

  // user1 approves 10,000 Dapp...
  transaction = await DApp.connect(user1).approve(exchange.getAddress(), amount)
  await transaction.wait()
  console.log(`Approved ${amount} tokens from ${user1.address}`)

  // user1 deposits 10,000 DApp...
  transaction = await exchange.connect(user1).depositToken(DApp.getAddress(), amount)
  await transaction.wait()
  console.log(`Deposited ${amount} Ether from ${user1.address}\n`)

  // User 2 Approves mETH
  transaction = await mETH.connect(user2).approve(exchange.getAddress(), amount)
  await transaction.wait()
  console.log(`Approved ${amount} tokens from ${user2.address}`)

  // User 2 Deposits mETH
  transaction = await exchange.connect(user2).depositToken(mETH.getAddress(), amount)
  await transaction.wait()
  console.log(`Deposited ${amount} tokens from ${user2.address}\n`)

  /////////////////////////////////////////////////////////////
  // Seed a Cancelled Order
  //

  // User 1 makes order to get tokens
  let orderId
  transaction = await exchange.connect(user1).makeOrder(mETH.getAddress(), tokens(100), DApp.getAddress(), tokens(5))
  result = await transaction.wait()
  console.log(`Made order from ${user1.address}`)

  // User 1 cancels order
  orderId = result.logs[0].args.id
  // orderId = result.events[0].args.id
  transaction = await exchange.connect(user1).cancelOrder(orderId)
  result = await transaction.wait()
  console.log(`Cancelled order from ${user1.address}\n`)

  // Wait 1 second
  await wait(1)

  /////////////////////////////////////////////////////////////
  // Seed Filled Orders
  //

  // User 1 makes order
  transaction = await exchange.connect(user1).makeOrder(mETH.getAddress(), tokens(100), DApp.getAddress(), tokens(10))
  result = await transaction.wait()
  console.log(`Made order from ${user1.address}`)

  // User 2 fills order
  orderId = result.logs[0].args.id
  transaction = await exchange.connect(user2).fillOrder(orderId)
  result = await transaction.wait()
  console.log(`Filled order from ${user1.address}\n`)

  // Wait 1 second
  await wait(1)

  // User 1 makes another order
  transaction = await exchange.makeOrder(mETH.getAddress(), tokens(50), DApp.getAddress(), tokens(15))
  result = await transaction.wait()
  console.log(`Made order from ${user1.address}`)

  // User 2 fills another order
  orderId = result.logs[0].args.id
  transaction = await exchange.connect(user2).fillOrder(orderId)
  result = await transaction.wait()
  console.log(`Filled order from ${user1.address}\n`)

  // Wait 1 second
  await wait(1)

  // User 1 makes final order
  transaction = await exchange.connect(user1).makeOrder(mETH.getAddress(), tokens(200), DApp.getAddress(), tokens(20))
  result = await transaction.wait()
  console.log(`Made order from ${user1.address}`)

  // User 2 fills final order
  orderId = result.logs[0].args.id
  transaction = await exchange.connect(user2).fillOrder(orderId)
  result = await transaction.wait()
  console.log(`Filled order from ${user1.address}\n`)

  // Wait 1 second
  await wait(1)

  /////////////////////////////////////////////////////////////
  // Seed Open Orders
  //

  // User 1 makes 10 orders
  for(let i = 1; i <= 10; i++) {
    transaction = await exchange.connect(user1).makeOrder(mETH.getAddress(), tokens(10 * i), DApp.getAddress(), tokens(10))
    result = await transaction.wait()

    console.log(`Made order from ${user1.address}`)

    // Wait 1 second
    await wait(1)
  }

  // User 2 makes 10 orders
  for (let i = 1; i <= 10; i++) {
    transaction = await exchange.connect(user2).makeOrder(DApp.getAddress(), tokens(10), mETH.getAddress(), tokens(10 * i))
    result = await transaction.wait()

    console.log(`Made order from ${user2.address}`)

    // Wait 1 second
    await wait(1)
  }

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });