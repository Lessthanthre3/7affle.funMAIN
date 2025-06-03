/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/basic.json`.
 */
export type Basic = {
  "address": "GUXx1x2kMBxJwLmyxWJMaWAqMhJHx7zabDqHdv7AFFLE",
  "metadata": {
    "name": "basic",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "buyTicket",
      "discriminator": [
        11,
        24,
        17,
        193,
        168,
        116,
        164,
        169
      ],
      "accounts": [
        {
          "name": "raffle",
          "writable": true
        },
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "ticket",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  99,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "raffle"
              },
              {
                "kind": "account",
                "path": "raffle.total_tickets",
                "account": "raffle"
              }
            ]
          }
        },
        {
          "name": "userStats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  45,
                  115,
                  116,
                  97,
                  116,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "buyer"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "cancelRaffle",
      "discriminator": [
        135,
        191,
        223,
        141,
        192,
        186,
        234,
        254
      ],
      "accounts": [
        {
          "name": "raffle",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "claimPrize",
      "discriminator": [
        157,
        233,
        139,
        121,
        246,
        62,
        234,
        235
      ],
      "accounts": [
        {
          "name": "raffle",
          "writable": true
        },
        {
          "name": "winner",
          "writable": true,
          "signer": true
        },
        {
          "name": "winningTicket"
        },
        {
          "name": "authority",
          "writable": true
        },
        {
          "name": "raffleHistory",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "drawWinner",
      "discriminator": [
        250,
        103,
        118,
        147,
        219,
        235,
        169,
        220
      ],
      "accounts": [
        {
          "name": "raffle",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "initializeProgramCounter",
      "discriminator": [
        130,
        106,
        236,
        61,
        114,
        11,
        131,
        153
      ],
      "accounts": [
        {
          "name": "programCounter",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  103,
                  114,
                  97,
                  109,
                  45,
                  99,
                  111,
                  117,
                  110,
                  116,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeRaffle",
      "discriminator": [
        110,
        142,
        92,
        16,
        15,
        58,
        89,
        229
      ],
      "accounts": [
        {
          "name": "raffle",
          "writable": true,
          "signer": true
        },
        {
          "name": "programCounter",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  103,
                  114,
                  97,
                  109,
                  45,
                  99,
                  111,
                  117,
                  110,
                  116,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "ticketPrice",
          "type": "u64"
        },
        {
          "name": "durationHours",
          "type": "u64"
        },
        {
          "name": "maxTickets",
          "type": "u32"
        }
      ]
    },
    {
      "name": "initializeUserStats",
      "discriminator": [
        254,
        243,
        72,
        98,
        251,
        130,
        168,
        213
      ],
      "accounts": [
        {
          "name": "userStats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  45,
                  115,
                  116,
                  97,
                  116,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "programCounter",
      "discriminator": [
        212,
        226,
        197,
        246,
        246,
        105,
        155,
        107
      ]
    },
    {
      "name": "raffle",
      "discriminator": [
        143,
        133,
        63,
        173,
        138,
        10,
        142,
        200
      ]
    },
    {
      "name": "raffleHistory",
      "discriminator": [
        71,
        168,
        4,
        190,
        82,
        101,
        40,
        226
      ]
    },
    {
      "name": "ticket",
      "discriminator": [
        41,
        228,
        24,
        165,
        78,
        90,
        235,
        200
      ]
    },
    {
      "name": "userStats",
      "discriminator": [
        176,
        223,
        136,
        27,
        122,
        79,
        32,
        227
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "raffleNotActive",
      "msg": "The raffle is not active"
    },
    {
      "code": 6001,
      "name": "raffleEnded",
      "msg": "The raffle has already ended"
    },
    {
      "code": 6002,
      "name": "raffleFull",
      "msg": "The raffle is full"
    },
    {
      "code": 6003,
      "name": "unauthorizedAccess",
      "msg": "Unauthorized access"
    },
    {
      "code": 6004,
      "name": "raffleNotEnded",
      "msg": "The raffle has not ended yet"
    },
    {
      "code": 6005,
      "name": "noTicketsSold",
      "msg": "No tickets have been sold"
    },
    {
      "code": 6006,
      "name": "noWinnerDrawn",
      "msg": "No winner has been drawn"
    },
    {
      "code": 6007,
      "name": "notWinningTicket",
      "msg": "This is not the winning ticket"
    },
    {
      "code": 6008,
      "name": "notTicketOwner",
      "msg": "You are not the owner of this ticket"
    },
    {
      "code": 6009,
      "name": "cannotCancelActive",
      "msg": "Cannot cancel a raffle with active tickets"
    },
    {
      "code": 6010,
      "name": "invalidDuration",
      "msg": "Invalid duration for raffle"
    },
    {
      "code": 6011,
      "name": "durationTooLong",
      "msg": "Duration too long, maximum is 30 days"
    },
    {
      "code": 6012,
      "name": "invalidTicketCount",
      "msg": "Invalid ticket count"
    },
    {
      "code": 6013,
      "name": "invalidTicketPrice",
      "msg": "Invalid ticket price"
    },
    {
      "code": 6014,
      "name": "noAvailableTickets",
      "msg": "No available ticket numbers"
    },
    {
      "code": 6015,
      "name": "tooManyTickets",
      "msg": "Too many tickets for a single raffle"
    },
    {
      "code": 6016,
      "name": "cannotUpdatePrice",
      "msg": "Cannot update ticket price after tickets have been sold"
    },
    {
      "code": 6017,
      "name": "alreadyDistributed",
      "msg": "Prizes have already been distributed for this period"
    },
    {
      "code": 6018,
      "name": "invalidPrizeAmount",
      "msg": "Invalid prize amount"
    }
  ],
  "types": [
    {
      "name": "programCounter",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "raffleCount",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "raffle",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "ticketPrice",
            "type": "u64"
          },
          {
            "name": "startTimestamp",
            "type": "i64"
          },
          {
            "name": "endTimestamp",
            "type": "i64"
          },
          {
            "name": "maxTickets",
            "type": "u32"
          },
          {
            "name": "totalTickets",
            "type": "u32"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "winner",
            "type": {
              "option": "u32"
            }
          },
          {
            "name": "raffleId",
            "type": "string"
          },
          {
            "name": "usedNumbers",
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "raffleHistory",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "raffleId",
            "type": "string"
          },
          {
            "name": "raffleName",
            "type": "string"
          },
          {
            "name": "creationTimestamp",
            "type": "i64"
          },
          {
            "name": "endTimestamp",
            "type": "i64"
          },
          {
            "name": "totalTicketsSold",
            "type": "u32"
          },
          {
            "name": "maxTickets",
            "type": "u32"
          },
          {
            "name": "finalPrizeAmount",
            "type": "u64"
          },
          {
            "name": "winnerTicket",
            "type": "u32"
          },
          {
            "name": "winnerAddress",
            "type": "pubkey"
          },
          {
            "name": "claimTimestamp",
            "type": "i64"
          },
          {
            "name": "transactionSignature",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "ticket",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "raffle",
            "type": "pubkey"
          },
          {
            "name": "ticketNumber",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "userStats",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "totalTicketsPurchased",
            "type": "u32"
          },
          {
            "name": "weeklyTickets",
            "type": "u32"
          },
          {
            "name": "monthlyTickets",
            "type": "u32"
          },
          {
            "name": "currentWeek",
            "type": "u32"
          },
          {
            "name": "currentMonth",
            "type": "u32"
          }
        ]
      }
    }
  ]
};
