export const IDL = {
  "version": "0.1.0",
  "name": "basic",
  "instructions": [
    {
      "name": "initializeProgramCounter",
      "accounts": [
        {
          "name": "programCounter",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "initializeRaffle",
      "accounts": [
        {
          "name": "raffle",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "programCounter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
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
      "name": "buyTicket",
      "accounts": [
        {
          "name": "raffle",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "ticket",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "participantFlag",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userStats",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "drawWinner",
      "accounts": [
        {
          "name": "raffle",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "ProgramCounter",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "raffleCount",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "Raffle",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
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
              "option": "publicKey"
            }
          },
          {
            "name": "raffleId",
            "type": "string"
          },
          {
            "name": "usedNumbers",
            "type": {
              "vec": "u8"
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "RaffleNotActive",
      "msg": "The raffle is not active"
    },
    {
      "code": 6001,
      "name": "RaffleEnded",
      "msg": "The raffle has already ended"
    },
    {
      "code": 6002,
      "name": "RaffleFull",
      "msg": "The raffle is full"
    }
  ]
};
