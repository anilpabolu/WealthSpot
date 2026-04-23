export interface BffInvestment {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyCity: string;
  propertyImage: string;
  amount: number;
  units: number;
  irr: number;
  status: string;
  paymentStatus: string;
  investedAt: string;
  maturityDate: string;
  currentValue: number;
  returns: number;
  returnPercentage: number;
}

export interface BffInvestmentSummary {
  totalInvested: number;
  currentValue: number;
  totalReturns: number;
  avgIrr: number;
  activeInvestments: number;
  propertiesCount: number;
}
