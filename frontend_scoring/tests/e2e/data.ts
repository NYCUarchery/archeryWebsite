export class User {
  username: string;
  password: string;
  name: string;
  email: string;
  constructor(
    name: string,
    username?: string,
    password?: string,
    email?: string
  ) {
    this.name = name;
    this.username = username ? username : getRandomUsername();
    this.password = password ? password : getRandomPassword();
    this.email = email ? email : getRandomEmail();
  }
}

export class Admin extends User {}
export class Player extends User {
  target: number;
  lane: number;
  rounds: Round[];
  constructor(
    name: string,
    target: number,
    lane: number,
    roundsLength: number,
    username?: string,
    password?: string
  ) {
    super(name, username, password);
    this.target = target;
    this.lane = lane;
    this.rounds = getRandomRounds(roundsLength);
  }
}

interface Round {
  ends: End[];
}
interface End {
  scores: number[];
}
function getRandomUsername(): string {
  const adjectives = [
    "Quick",
    "Lazy",
    "Happy",
    "Sad",
    "Brave",
    "Clever",
    "Calm",
    "Eager",
    "Fancy",
    "Gentle",
  ];
  const nouns = [
    "Lion",
    "Tiger",
    "Bear",
    "Wolf",
    "Fox",
    "Hawk",
    "Eagle",
    "Shark",
    "Whale",
    "Dolphin",
  ];

  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 1000);

  return `${randomAdjective}${randomNoun}${randomNumber}`;
}

function getRandomPassword(length: number = 10): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return password;
}

function getRandomRounds(length): Round[] {
  let rounds: Round[] = [];
  for (let i = 0; i < length; i++) {
    let ends = getRandomEnds(6);
    rounds.push({ ends });
  }
  return rounds;
}

function getRandomEnds(length): End[] {
  let ends: End[] = [];
  for (let i = 0; i < length; i++) {
    let scores: number[] = [];
    for (let j = 0; j < 6; j++) {
      scores.push(Math.floor(Math.random() * 10));
    }
    ends.push({ scores });
  }
  return ends;
}

function getRandomEmail(): string {
  const domains = ["example.com", "mail.com", "test.com", "domain.com"];
  const randomDomain = domains[Math.floor(Math.random() * domains.length)];
  const username = getRandomUsername();

  return `${username}@${randomDomain}`;
}
