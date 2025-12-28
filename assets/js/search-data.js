// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-blog",
          title: "blog",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/blog/";
          },
        },{id: "nav-bookshelf",
          title: "bookshelf",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/books/";
          },
        },{id: "post-determining-blocktemplate-fee-increase-using-fee-rate-diagram",
        
          title: "Determining BlockTemplate Fee Increase Using Fee Rate Diagram",
        
        description: "A method to track potential fee increases in block templates without full rebuilds using Cluster Mempool features",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/detecting-blocktemplate-fee-increase-using-feerate-diagram/";
          
        },
      },{id: "post-analyzing-mining-pool-behavior-to-address-bitcoin-core-s-double-coinbase-reservation-issue",
        
          title: "Analyzing Mining Pool Behavior to Address Bitcoin Core’s Double Coinbase Reservation Issue",
        
        description: "Analysis of mining pool behavior regarding Bitcoin Core’s double coinbase reservation bug and its impact on block template weights.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/analyzing-mining-pool-behavior-to-address-bitcoin-core-double-coinbase-reservation-issue/";
          
        },
      },{id: "post-bitcoind-block-policy-fee-rate-estimator-modes-analysis",
        
          title: "Bitcoind Block Policy Fee Rate Estimator Modes Analysis",
        
        description: "Analysis of Bitcoind estimatesmartfee modes",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2024/bitcoind-policy-estimator-analysis/";
          
        },
      },{id: "post-challenges-with-estimating-transaction-fee-rates",
        
          title: "Challenges with Estimating Transaction Fee Rates",
        
        description: "This post explores the reasons why estimating how much to pay for your transaction as fee is challenging, and the ways to overcome these challenges.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2023/challenges-with-estimating-tx-feerate/";
          
        },
      },{id: "post-tips-and-techniques-for-constructing-private-transactions-with-privatetx-library",
        
          title: "Tips and Techniques for Constructing Private Transactions with Privatetx library",
        
        description: "How to construct Bitcoin Transactions that are mystery to chain analysis",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2023/tips-and-techniques-for-constructing-private-txs/";
          
        },
      },{id: "books-21-lessons-for-the-21st-century",
          title: '21 Lessons for the 21st Century',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/21_lessons_of_the_21_century/";
            },},{id: "books-abc-of-anarchism",
          title: 'ABC of Anarchism',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/A_B_C_of_anarchism/";
            },},{id: "books-atomic-habits",
          title: 'Atomic Habits',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/atomic_habits/";
            },},{id: "books-bitcoin-dev-philosophy",
          title: 'Bitcoin Dev Philosophy',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/bitcoin_dev_philosophy/";
            },},{id: "books-c-concurrency-in-action",
          title: 'C++ Concurrency in Action',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/cpp_concurrency_in_action/";
            },},{id: "books-c-primer",
          title: 'C++ Primer',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/cpp_primer/";
            },},{id: "books-deep-work",
          title: 'Deep Work',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/deep_work/";
            },},{id: "books-effective-modern-c",
          title: 'Effective Modern C++',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/effective_mordern_cpp/";
            },},{id: "books-governing-the-commons",
          title: 'Governing the Commons',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/governing_the_commons/";
            },},{id: "books-a-graduate-course-in-applied-cryptography",
          title: 'A Graduate Course in Applied Cryptography',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/graduate_course_on_cryptography/";
            },},{id: "books-independence",
          title: 'Independence',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/independence/";
            },},{id: "books-the-laws-of-human-nature",
          title: 'The Laws of Human Nature',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/laws_of_human_nature/";
            },},{id: "books-magana-jari-ce",
          title: 'Magana Jari Ce',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/magana_jari_ce/";
            },},{id: "books-mastering-bitcoin",
          title: 'Mastering Bitcoin',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/mastering_bitcoin/";
            },},{id: "books-meditations",
          title: 'Meditations',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/meditations/";
            },},{id: "books-the-alchemist",
          title: 'The Alchemist',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/the_alchemist/";
            },},{id: "books-the-beginning-of-infinity",
          title: 'The Beginning of Infinity',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/the_beginning_of_infinity/";
            },},{id: "books-there-was-a-country",
          title: 'There Was a Country',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/there_was_a_country/";
            },},{id: "books-things-fall-apart",
          title: 'Things Fall Apart',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/things_fall_apart/";
            },},{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%61%62%75%62%61%6B%61%72%73%61%64%69%71%69%73%6D%61%69%6C@%70%72%6F%74%6F%6E.%6D%65", "_blank");
        },
      },{
        id: 'social-github',
        title: 'GitHub',
        section: 'Socials',
        handler: () => {
          window.open("https://github.com/ismaelsadeeq", "_blank");
        },
      },{
        id: 'social-rss',
        title: 'RSS Feed',
        section: 'Socials',
        handler: () => {
          window.open("/feed.xml", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
