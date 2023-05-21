const data = {
  creditCards: [
    {
      id: 1,
      name: "Citi Simplicity® Card",
      img: "https://www.citi.com/CRD/images/card/citi-simplicity-card.png",
      url: "https://www.citi.com/credit-cards/credit-card-details/citi.action?ID=citi-simplicity-credit-card&category=view-all-credit-cards&afc=1C2&intc=7~7~67~1~MCT~1~CMSDefaultOffer~1~simply-credit-card~1~2021~1~NA~1~",
      intro:
        "The only card with No Late Fees, No Penalty Rate, and No Annual Fee… EVER.",
      intro2:
        "0% Intro APR on balance transfers for 21 months from date of first transfer. All transfers must be completed in first 4 months. After that, the variable APR will be 14.74% - 24.74%, based on your creditworthiness.*",
      intro3:
        "0% Intro APR on purchases for 12 months from date of account opening. After that, the variable APR will be 14.74% - 24.74%, based on your creditworthiness.*",
      intro4:
        "Balance Transfer Fee: Either $5 or 5% of the amount of each credit card balance transfer, whichever is greater.*",
      intro5:
        "Balance transfers must be completed within 4 months of account opening.",
      intro6: "No Annual Fee*",
      intro7: "No Late Fees, No Penalty Rate, and No Annual Fee… EVER*",
      pros: [
        "No Late Fees, No Penalty Rate, and No Annual Fee… EVER*",
        "0% Intro APR on balance transfers for 21 months from date of first transfer. All transfers must be completed in first 4 months. After that, the variable APR will be 14.74% - 24.74%, based on your creditworthiness.*",
        "0% Intro APR on purchases for 12 months from date of account opening. After that, the variable APR will be 14.74% - 24.74%, based on your creditworthiness.*",
        "Balance Transfer Fee: Either $5 or 5% of the amount of each credit card balance transfer, whichever is greater.*",
        "Balance transfers must be completed within 4 months of account opening.",
        "No Annual Fee*",
      ],
      cons: [
        "No rewards program",
        "No sign-up bonus",
        "No intro APR on purchases",
        "No intro APR on balance transfers",
        "No foreign transaction fee",
        "Hign regular APR",
      ],
      credit: "Excellent",
      bestPractice: [
        "When you need emergency money, but can't pay it right away",
        "Manage your payment spliting",
        "Keep your credit utilization manageable",
        "Monitor your credit",
      ],
    },
  ],
  general: {
    bestPractice: [
      "Keep your credit utilization low, suggested under 30%",
      "Don't apply for multiple cards at once",
      "Don't close unused credit cards",
      "Dispute credit report errors",
      "Monitor your credit",
      "Pay your bills on time and in full",
    ],
  },
};

export default function CreditCarads() {
  return (
    <div>
      <h2>Credit Cards</h2>
    </div>
  );
}
