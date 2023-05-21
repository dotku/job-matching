import styled from "styled-components";

const StyledLabel = styled.label`
  font-weight: 600;
  margin-right: 4px;
`;
export default function IndustryFinance() {
  const companies = [
    {
      name: "Lengding Club",
      url: "https://www.lendingclub.com/",
      logo: "https://www.lendingclub.com/asset/i/logo-2x.png",
      description:
        "LendingClub is America’s largest lending marketplace, connecting borrowers with investors since 2007. Our mission is to transform the banking system to make credit more affordable and investing more rewarding. Today, we're helping over 3 million Americans achieve their financial goals.",
      location: "San Francisco, CA",
      founded: 2006,
      revenue: {
        2022: 1200000000000,
      },
    },
    {
      name: "SoFi",
      url: "https://www.sofi.com/",
      logo: "https://www.sofi.com/wp-content/themes/sofi/img/logo.svg",
      description:
        "SoFi is a digital personal finance company whose mission is to help people achieve financial independence to realize their ambitions—whether that be to buy a house one day, start a family on their own terms or be debt free. We aim to be at the center of our members’ financial lives, and to help every member Get Their Money Right®.",
      location: "San Francisco, CA",
      founded: 2011,
      revenue: {
        2022: 1500000000000,
      },
    },
    {
      name: "Affirm",
      url: "https://www.affirm.com/",
      logo: "https://www.affirm.com/images/affirm-logo.svg",
      description:
        "Affirm is a more flexible and transparent alternative to credit cards. Affirm offers instant financing for online purchases to be paid in fixed monthly installments over 3, 6, or 12 months.",
      location: "San Francisco, CA",
      founded: 2012,
      revenue: {
        2022: 1300000000000,
      },
    },
    {
      name: "Prosper",
      url: "https://www.prosper.com/",
      logo: "https://www.prosper.com/wp-content/themes/prosper/images/logo.svg",
      description:
        "Prosper is America’s first marketplace lending platform, with over $9 billion in funded loans. Prosper allows people to invest in each other in a way that is financially and socially rewarding. On Prosper, borrowers list loan requests between $2,000 and $40,000 and individual lenders invest as little as $25 in each loan listing they select. In addition to credit scores, ratings and histories, investors can consider borrowers’ personal loan descriptions, endorsements from friends, and community affiliations. Prosper handles the servicing of the loan on behalf of the matched borrowers and investors.",
      location: "San Francisco, CA",
      founded: 2005,
      revenue: {
        2022: 116200000,
      },
    },
    {
      name: "Intuit",
      url: "https://www.intuit.com/",
      logo: "https://www.intuit.com/content/dam/intuit/intuitcom/logo.png",
      description:
        "Intuit is a mission-driven, global financial platform company that gives everyone the opportunity to prosper. With products like TurboTax, QuickBooks and Mint, we’re using technology to build solutions to challenging financial problems for millions of people around the world.",
      location: "Mountain View, CA",
      founded: 1983,
      revenue: {
        2022: 12726000000,
      },
    },
    {
      name: "Stripe",
      url: "https://stripe.com/",
      logo: "https://stripe.com/img/v3/home/twitter.png",
      description:
        "Stripe is a technology company that builds economic infrastructure for the internet. Businesses of every size—from new startups to public companies—use our software to accept payments and manage their businesses online.",
      location: "San Francisco, CA",
      founded: 2011,
      valuation: {
        2022: 95000000000,
      },
    },
    {
      name: "Klarna",
      url: "https://www.klarna.com/",
      logo: "https://www.klarna.com/assets/images/logo.svg",
      description:
        "Klarna is a leading global payments and shopping service, providing smarter and more flexible shopping and purchase experiences to 90 million active consumers across more than 250,000 merchants in 17 countries. Klarna offers direct payments, pay after delivery options and installment plans in a smooth one-click purchase experience that lets consumers pay when and how they prefer to.",
      location: "Stockholm, Sweden",
      founded: 2005,
      valuation: {
        2022: 46000000000,
      },
    },
    {
      name: "FTX",
      url: "https://ftx.com/",
      logo: "https://ftx.com/images/logo.png",
      description:
        "FTX is a cryptocurrency exchange built by traders, for traders. We strive to build a platform powerful enough for professional trading firms and intuitive enough for first-time users.",
      location: "Hong Kong",
      founded: 2019,
      collapsed: 2022,
      valuation: {
        2022: 18000000000,
      },
    },
    {
      name: "Chime",
      url: "https://www.chime.com/",
      logo: "https://www.chime.com/assets/images/chime-logo.svg",
      description:
        "Chime is a financial technology company, not a bank. Banking services provided by The Bancorp Bank or Stride Bank, N.A.; Members FDIC",
      location: "San Francisco, CA",
      founded: 2013,
      valuation: {
        2022: 14000000000,
      },
    },
    {
      name: "Ripple",
      url: "https://ripple.com/",
      logo: "https://ripple.com/wp-content/uploads/2019/01/ripple_logo_dark.svg",
      description:
        "Ripple provides one frictionless experience to send money globally using the power of blockchain. By joining Ripple’s growing, global network, financial institutions can process their customers’ payments anywhere in the world instantly, reliably and cost-effectively. Banks and payment providers can use the digital asset XRP to further reduce their costs and access new markets.",
      location: "San Francisco, CA",
      founded: 2012,
      valuation: {
        2022: 10000000000,
      },
    },
    {
      name: "Blockchain.com",
      url: "https://www.blockchain.com/",
      logo: "https://www.blockchain.com/static/img/logo.svg",
      description:
        "Blockchain.com is the most popular place to securely buy, store, and trade Bitcoin, Ethereum, and other top cryptocurrencies.",
      location: "London, UK",
      founded: 2011,
      valuation: {
        2022: 5000000000,
      },
    },
    {
      name: "Plaid",
      url: "https://plaid.com/",
      logo: "https://plaid.com/assets/img/branding/plaid-logo.svg",
      description:
        "Plaid is a technology platform that enables applications to connect with users’ bank accounts. Plaid focuses on lowering the barriers to entry in financial services by making it easier and safer to use financial data. The company builds a data transfer network that powers fintech and digital finance products.",
      location: "San Francisco, CA",
      founded: 2013,
      valuation: {
        2022: 5000000000,
      },
    },
    {
      name: "OpenSea",
      url: "https://opensea.io/",
      logo: "https://opensea.io/static/images/logos/opensea.svg",
      description:
        "OpenSea is the first and largest marketplace for user-owned digital goods, which include collectibles, gaming items, domain names, digital art, and other assets backed by a blockchain. On OpenSea, anyone can buy or sell these items through a smart contract. This allows for buyer and seller protections that don’t exist in traditional marketplaces.",
      location: "New York, NY",
      founded: 2017,
      valuation: {
        2022: 3000000000,
      },
    },
    {
      name: "Brex",
      url: "https://brex.com/",
      logo: "https://brex.com/wp-content/uploads/2019/03/brex_logo.svg",
      description:
        "Brex is rebuilding B2B financial products, starting with a corporate card for technology companies. They help startups of all sizes (from recently incorporated to later-stage companies) to instantly get a card that has 20x higher limits, completely automates expense management, kills receipt tracking and magically integrates with their accounting systems.",
      location: "San Francisco, CA",
      founded: 2017,
      valuation: {
        2022: 3000000000,
      },
    },
    {
      name: "GoodLeap",
      url: "https://www.goodleap.com/",
      logo: "https://www.goodleap.com/wp-content/uploads/2021/06/goodleap-logo.svg",
      description:
        "GoodLeap is a leading provider of home improvement financing solutions. The company partners with contractors and retailers nationwide to offer financing for home improvement projects. GoodLeap’s technology platform simplifies the financing process for contractors and homeowners by offering competitive rates, a fast and frictionless application process, and same-day credit decisions.",
      location: "Lehi, UT",
      founded: 2014,
      valuation: {
        2022: 3000000000,
      },
    },
    {
      name: "Visa",
      url: "https://usa.visa.com/",
      logo: "https://usa.visa.com/dam/VCOM/regional/na/usa/global-elements/images/visa-logo.svg",
      description:
        "Visa is a global payments technology company working to enable consumers, businesses, banks and governments to use digital currency. Visa’s network connects thousands of financial institutions and millions of merchants and billers with powerful and secure payments products.",
      location: "Foster City, CA",
      founded: 1958,
      revenue: {
        2022: 25000000000,
      },
    },
  ];

  return (
    <>
      <h2>Finance </h2>
      <form>
        <label>Ask a question</label>
        <textarea
          className="form-control mb-3"
          placeholder="ask me anything related to finance industry"
        />
        <div className="text-right">
          <button className="btn btn-primary">Ask</button>
        </div>
      </form>
      <h3>Companies ({companies.length})</h3>
      <div className="row">
        {companies.map((company) => (
          <div className="col-md-4">
            <div className="card mb-3">
              <div className="card-body">
                <h3 className="card-title">
                  <a
                    href={company.url}
                    target="_blank"
                    rel="external noreferrer"
                  >
                    {company.name}
                  </a>
                </h3>
                <div>{company.description}</div>
                <div className="text-right">
                  <StyledLabel>Revenue:</StyledLabel>
                  {company.revenue ? (
                    <span>
                      {new Intl.NumberFormat("en", {
                        notation: "compact",
                        style: "currency",
                        currency: "USD",
                      }).format(company.revenue[2022])}
                    </span>
                  ) : (
                    "N/A"
                  )}
                </div>

                <div className="text-right">
                  <StyledLabel>Valuation:</StyledLabel>
                  {company.valuation ? (
                    <span>
                      {new Intl.NumberFormat("en", {
                        notation: "compact",
                        style: "currency",
                        currency: "USD",
                      }).format(company.valuation[2022])}
                    </span>
                  ) : (
                    "N/A"
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
