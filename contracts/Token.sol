// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;
import "hardhat/console.sol";

// This is for 1st Commit
// pragma solidity ^0.8.9; in Lock.sol

contract Token{
     string public name ;
     string public symbol ;
     uint256 public decimals = 18;
     uint256 public totalSupply ; // total supply is handeled in smallest unit.

     mapping(address => uint256) public balanceOf;
     mapping(address => mapping(address => uint256)) public allowance;

     event Transfer(
          address indexed _from,
          address indexed _to,
          uint256 _value
     );

     event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

     constructor(string memory _name, string memory _symbol, uint256 _totalSupply){
          name = _name;
          symbol = _symbol;
          totalSupply = _totalSupply * (10 ** decimals);
          balanceOf[msg.sender] = totalSupply; // here msg.sender is address
          // of deployer, and by default in solidity the first address in
          // blockchain node is the deployer, so when the constructor runs
          // it will assign the first  address of blockchain node as msg.sender
          // and then mapping (key(msg.sender) ---> value(taotalSupply)) will be done.

     }

     function transfer(address _to, uint _value)
     public returns(bool success){

          require(balanceOf[msg.sender]>=_value);
          
          _transfer(msg.sender, _to, _value);
         
          return true;

     }

     function _transfer(
        address _from,
        address _to,
        uint256 _value
    ) internal {
        require(_to != address(0));

        balanceOf[_from] = balanceOf[_from] - _value;
        balanceOf[_to] = balanceOf[_to] + _value;

        emit Transfer(_from, _to, _value);
    }

     function approve(address _spender, uint256 _value)
        public
        returns(bool success)
    {
        require(_spender != address(0));

        allowance[msg.sender][_spender] = _value;

        // yha pe exchance(_spender) decide ho chuka(yha pe address[0]) agar koi
        // dursra account use hua jasie account[9] to transferfrom
        // function me msg.sender account[2] kas nhi hoga jise ki 
        // transferFrom function run hi nhi hoga, kyu ki wo value approve me nhi h.

        // nested mapping ka matlb owner(deployer in this case) can transfer 
        // use multiple excahnge to transfer amount

        emit Approval(msg.sender, _spender, _value);
        return true;
    }

     function transferFrom(
        address _from,
        address _to,
        uint256 _value
    )
        public
        returns (bool success)
    {

        // console.log(_from,_to,_value);
        require(_value <= balanceOf[_from],'Insufficient Balance 1');
        require(_value <= allowance[_from][msg.sender],'Insufficient Balance 2');// yha pe exchange ko trust kar rhe

        allowance[_from][msg.sender] = allowance[_from][msg.sender] - _value;

        _transfer(_from, _to, _value);

        return true;
    }
}