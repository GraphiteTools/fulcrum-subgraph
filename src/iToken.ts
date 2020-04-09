import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";

import { iToken as iTokenContract, Transfer, Mint, Burn, Borrow, Claim } from "../generated/iDAI Token/iToken";
import { iToken, Token, Balance, User } from "../generated/schema";

export function handleTransfer(event: Transfer): void {
	let address = event.address;
	let from = event.params.from;
	let to = event.params.to;
	let value = event.params.value;

	let itokenContract = iTokenContract.bind(address);
	let itoken = iToken.load(address.toHexString());
	if (!itoken) {
		itoken = new iToken(address.toHexString());
		itoken.address = address;
		itoken.name = itokenContract.name();
		itoken.symbol = itokenContract.symbol();
		itoken.supplyIndex = new BigInt(0);

		let underlyingAddress = _getUnderlyingAddress(address);
		let token = new Token(underlyingAddress.toHexString());

		itoken.underlying = underlyingAddress.toHexString();
		token.address = underlyingAddress;
		token.save();
	}

	let borrowRateCall = itokenContract.try_avgBorrowInterestRate();
	let borrowRate = borrowRateCall.reverted
		? itokenContract.borrowInterestRate()
		: borrowRateCall.value;
	itoken.borrowRate = borrowRate;
	itoken.supplyRate = itokenContract.supplyInterestRate();

	let zeroAddress = '0x0000000000000000000000000000000000000000';
	// Update balances
	if (from.toHexString() != zeroAddress) {
		let fromBalanceId = from.toHexString() + '-' + address.toHexString();
		let fromBalance = Balance.load(fromBalanceId);
		if (!fromBalance) {
			fromBalance = new Balance(fromBalanceId);
			fromBalance.user = from.toHexString();
			fromBalance.balance = new BigInt(0);
			fromBalance.token = itoken.id;
		}
		fromBalance.balance -= value;
		fromBalance.save();
	}
	if (to.toHexString() != zeroAddress) {
		let toBalanceId = to.toHexString() + '-' + address.toHexString();
		let toBalance = Balance.load(toBalanceId);
		if (!toBalance) {
			toBalance = new Balance(toBalanceId);
			toBalance.user = to.toHexString();
			toBalance.balance = new BigInt(0);
			toBalance.token = itoken.id;
		}
		toBalance.balance += value;
		toBalance.save();
	}

	// Update token balances
	if (from.toHexString() != zeroAddress) {
		let fromUserId = from.toHexString();
		let fromUser = User.load(fromUserId);
		if (!fromUser) {
			fromUser = new User(fromUserId);
			fromUser.save();
		}
	}
	if (to.toHexString() != zeroAddress) {
		let toUserId = to.toHexString();
		let toUser = User.load(toUserId);
		if (!toUser) {
			toUser = new User(toUserId);
			toUser.save();
		}
	}

	itoken.save();
}

export function handleMint(event: Mint): void {
	let address = event.address;
	let index = event.params.price;

	let itoken = iToken.load(address.toHexString());
	if (!itoken) {
		return;
	}

	itoken.supplyIndex = index;

	let itokenContract = iTokenContract.bind(address);
	let borrowRateCall = itokenContract.try_avgBorrowInterestRate();
	let borrowRate = borrowRateCall.reverted
		? itokenContract.borrowInterestRate()
		: borrowRateCall.value;
	itoken.borrowRate = borrowRate;
	itoken.supplyRate = itokenContract.supplyInterestRate();

	itoken.save();
}

export function handleBurn(event: Burn): void {
	let address = event.address;
	let index = event.params.price;

	let itoken = iToken.load(address.toHexString());
	if (!itoken) {
		return;
	}

	itoken.supplyIndex = index;

	let itokenContract = iTokenContract.bind(address);
	let borrowRateCall = itokenContract.try_avgBorrowInterestRate();
	let borrowRate = borrowRateCall.reverted
		? itokenContract.borrowInterestRate()
		: borrowRateCall.value;
	itoken.borrowRate = borrowRate;
	itoken.supplyRate = itokenContract.supplyInterestRate();

	itoken.save();
}

export function handleBorrow(event: Borrow): void {
	let address = event.address;

	let itokenContract = iTokenContract.bind(address);
	let itoken = iToken.load(address.toHexString());
	let borrowRateCall = itokenContract.try_avgBorrowInterestRate();
	let borrowRate = borrowRateCall.reverted
		? itokenContract.borrowInterestRate()
		: borrowRateCall.value;
	itoken.borrowRate = borrowRate;
	itoken.supplyRate = itokenContract.supplyInterestRate();
	itoken.save();
}

export function handleClaim(event: Claim): void {
	let address = event.address;

	let itokenContract = iTokenContract.bind(address);
	let itoken = iToken.load(address.toHexString());
	let borrowRateCall = itokenContract.try_avgBorrowInterestRate();
	let borrowRate = borrowRateCall.reverted
		? itokenContract.borrowInterestRate()
		: borrowRateCall.value;
	itoken.borrowRate = borrowRate;
	itoken.supplyRate = itokenContract.supplyInterestRate();
	itoken.save();
}

function _getUnderlyingAddress(address: Address): Address {
	let itokenContract = iTokenContract.bind(address);
	let loanTokenAddress = itokenContract.loanTokenAddress();

	let sUsdProxyAddress = Address.fromString('0x57Ab1ec28D129707052df4dF418D58a2D46d5f51');

	if (loanTokenAddress == sUsdProxyAddress) {
		let sUsdAddress = Address.fromString('0x57Ab1E02fEE23774580C119740129eAC7081e9D3');
		return sUsdAddress;
	}
	return loanTokenAddress;
}
