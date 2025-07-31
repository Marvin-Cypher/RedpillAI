// Quick test to verify widget filtering by asset type
const { getCompanyAssetType } = require('./src/lib/companyDatabase.ts');

// Test company (Amazon - should be equity)
const amazonCompany = {
  id: 'amazon',
  name: 'Amazon',
  ticker: 'AMZN',
  company_type: 'traditional',
  sector: 'E-commerce/Cloud'
};

// Test crypto company
const cryptoCompany = {
  id: 'chainlink',
  name: 'Chainlink',
  ticker: 'LINK',
  company_type: 'crypto',
  sector: 'Blockchain'
};

console.log('Amazon asset type:', getCompanyAssetType(amazonCompany)); // Should be 'equity'
console.log('Chainlink asset type:', getCompanyAssetType(cryptoCompany)); // Should be 'crypto'

// Test token price widget compatibility
const TOKEN_PRICE_WIDGET = {
  compatibleAssetTypes: ['crypto']
};

const FUNDAMENTALS_WIDGET = {
  compatibleAssetTypes: ['equity']
};

function isWidgetCompatible(widget, companyAssetType) {
  return !widget.compatibleAssetTypes || 
         !companyAssetType || 
         widget.compatibleAssetTypes.includes(companyAssetType);
}

console.log('\nWidget compatibility tests:');
console.log('TOKEN_PRICE for Amazon (equity):', isWidgetCompatible(TOKEN_PRICE_WIDGET, 'equity')); // Should be false
console.log('TOKEN_PRICE for Chainlink (crypto):', isWidgetCompatible(TOKEN_PRICE_WIDGET, 'crypto')); // Should be true
console.log('FUNDAMENTALS for Amazon (equity):', isWidgetCompatible(FUNDAMENTALS_WIDGET, 'equity')); // Should be true
console.log('FUNDAMENTALS for Chainlink (crypto):', isWidgetCompatible(FUNDAMENTALS_WIDGET, 'crypto')); // Should be false