// Define types for KAI transactions and user balance
export interface KaiTransaction {
    id: string
    userId: string
    amount: number
    type: "credit" | "debit"
    description: string
    createdAt: string
  }
  
  export interface KaiBalance {
    balance: number
    transactions: KaiTransaction[]
  }
  
  