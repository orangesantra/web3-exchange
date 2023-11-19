// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;
import "hardhat/console.sol";


contract Check{
     string public name ;
     string public symbol ;
     uint256 public decimals = 18;
     uint256 public totalSupply ; // total supply is handeled in smallest unit.

     mapping(address => uint256) public balanceOf;
    
     constructor(string memory _name, string memory _symbol, uint256 _totalSupply){
          name = _name;
          symbol = _symbol;
          totalSupply = _totalSupply * (10 ** decimals);
          balanceOf[msg.sender] = totalSupply; 

     }


}