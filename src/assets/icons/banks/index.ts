import auSmallFinanceBank from './au-icon.png';
import axisBank from './axis-icon.png';
import defaultBank from './default-bank-icon.png';
import federalBank from './federal-icon.png';
import hdfcBank from './hdfc-icon.png';
import iciciBank from './icici-icon.png';
import idfcFirstBank from './idfc-icon.png';
import indianBank from './indian-icon.png';
import kotakMahindraBank from './kotak-icon.png';
import punjabNationalBank from './pnb-icon.png';
import sbiBank from './sbi-icon.png';
import ucoBank from './uco-icon.png';
// Export all bank icons
export const bankIcons = {
	'Axis Bank': axisBank,
	'AU Small Finance Bank': auSmallFinanceBank,
	'Federal Bank': federalBank,
	'HDFC Bank': hdfcBank,
	'ICICI Bank': iciciBank,
	'IDFC First Bank': idfcFirstBank,
	'Kotak Mahindra Bank': kotakMahindraBank,
	'Punjab National Bank': punjabNationalBank,
	'State Bank of India (SBI)': sbiBank,
	'UCO Bank': ucoBank,
	'INDIAN Bank': indianBank,
	Default: defaultBank,
};

export type BankIconName = keyof typeof bankIcons;

export const getBankIcon = (bankName: string) => {
	return bankIcons[bankName as BankIconName] || bankIcons.Default;
};
