class Player {
  constructor(inputs) {
      this.playerLocation = parseInt(inputs[0]); // id of the zone in which the player is located
      this.playerScore = parseInt(inputs[1]);
      this.playerPermanentDailyRoutineCards = parseInt(inputs[2]); // number of DAILY_ROUTINE the player has played. It allows them to take cards from the adjacent zones
      this.playerPermanentArchitectureStudyCards = parseInt(inputs[3]);
  }
}

class Application{
  constructor(inputs) {
      this.objectType = inputs[0];
      this.id = parseInt(inputs[1]);
      this.training = parseInt(inputs[2]); // number of TRAINING skills needed to release this application
      this.coding = parseInt(inputs[3]); // number of CODING skills needed to release this application
      this.dailyRoutine = parseInt(inputs[4]); // number of DAILY_ROUTINE skills needed to release this application
      this.taskPrioritization = parseInt(inputs[5]); // number of TASK_PRIORITIZATION skills needed to release this application
      this.architectureStudy = parseInt(inputs[6]); // number of ARCHITECTURE_STUDY skills needed to release this application
      this.continuousDelivery = parseInt(inputs[7]); // number of CONTINUOUS_DELIVERY skills needed to release this application
      this.codeReview = parseInt(inputs[8]); // number of CODE_REVIEW skills needed to release this application
      this.refactoring = parseInt(inputs[9]);
  }
}

class Card{
  constructor(inputs) {
      this.cardsLocation = inputs[0]; // the location of the card list. It can be HAND, DRAW, DISCARD or OPPONENT_CARDS (AUTOMATED and OPPONENT_AUTOMATED will appear in later leagues)
      this.training = parseInt(inputs[1]);
      this.coding = parseInt(inputs[2]);
      this.dailyRoutine = parseInt(inputs[3]);
      this.taskPrioritization = parseInt(inputs[4]);
      this.architectureStudy = parseInt(inputs[5]);
      this.continuousDelivery = parseInt(inputs[6]);
      this.codeReview = parseInt(inputs[7]);
      this.refactoring = parseInt(inputs[8]);
      this.bonus = parseInt(inputs[9]);
      this.technicalDebt = parseInt(inputs[10]);
      //console.error(this);
  }
}

class Move{
  constructor(input) {
      this.name = input
      if(input.startsWith('MOVE ')) {
          const targets = input.slice('MOVE '.length).split(' ');
          this.slot = parseInt(targets[0]);
          this.target = parseInt(targets[0]);
          // console.error(targets);
          if(targets.length>1) this.target = parseInt(targets[1]);
      }
  }
}

let gamePhase,
nApplications,
players,
nCardLocations,
cardsLocations,
nPossibleMoves,
possibleMoves,
myHand,
myLocation,
hands,
yourLocation,
possibleSlots;

pickedCard = {}
playedCard = {}
playedCardApp = {}

let debug = true,
  applications = [];

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

_readline = () => {
  let entry = readline();
  if(debug) console.error(entry);
  return entry;
};


cardTypes = ['training', 'coding', 'dailyRoutine', 'taskPrioritization', 
'architectureStudy', 'continuousDelivery', 'codeReview', 'refactoring'];

cardTypesUp = ['TRAINING', 'CODING', 'DAILY_ROUTINE', 'TASK_PRIORITIZATION', 
'ARCHITECTURE_STUDY', 'CONTINUOUS_INTEGRATION', 'CODE_REVIEW', 'REFACTORING'];

cardSlots = {
  "TRAINING": 0,
  "CODING": 1,
  "DAILY_ROUTINE": 2,
  "TASK_PRIORITIZATION": 3,
  "ARCHITECTURE_STUDY": 4,
  "CONTINUOUS_INTEGRATION": 5,
  "CODE_REVIEW": 6,
  "REFACTORING": 7,
};

function slotCost(slot) {
  if(myLocation === -1) return slot+1;
  let cost = slot - myLocation;
  if(cost <= 0) cost += 8;
  return cost;
}


function choseBestMove2(hand, app, possibleMoves, myLocation) {
  possibleSlots = [];
  cardTypes.forEach( (c, i) => {
      possibleSlots[i] = possibleMoves.some(m => m.target === i);
  });

  // console.error(hand);
  // console.error(app);
  // console.error(possibleMoves);
  console.error(possibleSlots);
  let bestMove = undefined;
  let bestCost = 10_000_000;
  cardTypes.forEach( (c, i) => {
      if(possibleSlots[i]) {
          // console.error(`card = ${c}`);
          // console.error(`card = ${app[c]}`);
          // console.error(`card = ${hand[c]}`);
          const delta = app[c] - hand[c];
          // console.error(`delta = ${delta}`);
          if(delta) {
              let cost = slotCost(i);
              //if(c === 'architectureStudy') cost = 0;
              if(cost < bestCost) {
                  bestMove = i;
                  bestCost = cost;
              }
          }
      }
  })
  console.error(`bestMove = ${bestMove}`);
  if(bestMove === undefined) {
      // console.log('ERROR');
      return possibleMoves[0];
  }
  return possibleMoves.filter(m => m.target === bestMove)[0];
}

function appDiff1(hand, app) {
  // console.error(hand);
  // console.error(app);
  let res = 0;
  cardTypes.forEach((c, i) => {
      // console.error(`card = ${c}`);
      // console.error(`card = ${app[c]}`);
      // console.error(`card = ${hand[c]}`);
      let deltaCard = 0;
      if(app[c] > hand[c]) {
          deltaCard = app[c] - hand[c];
          if(deltaCard > 2) deltaCard += (deltaCard - 2) * 10; // More cost for each full turn to do
      }
      let deltaSlot = slotCost(i);

      res += deltaCard * deltaSlot;
  })
  // console.error(`appDiff1 = ${res}`);
  return res;
}

function bestApp() {
  let bestDiff = 10_000_000;
  let bestApp = undefined;
  applications.forEach(app => {
      const dist = appDiff1(myHand, app);
      if( dist < bestDiff) {
          bestDiff = dist;
          bestApp = app;
      }
  })
  console.error(`bestDiff = ${bestDiff}`);
  console.error(bestApp);
  return bestApp;
}

function move0() {
  console.error("move0");
  const app = bestApp();
  possibleMoves = possibleMoves.filter(m => m.name.startsWith('MOVE'));
  possibleMoves = possibleMoves.filter(m => availableSlot(m));
  if(myLocation > -1) 
      possibleMoves = possibleMoves.filter(m => !m.name.startsWith(`MOVE ${myLocation}`));
  
  if(yourLocation > -1) {
      possibleMoves = possibleMoves.filter(m => !m.name.startsWith(`MOVE ${yourLocation}`));
      possibleMoves = possibleMoves.filter(m => !m.name.startsWith(`MOVE ${(yourLocation+1)%8}`));
      possibleMoves = possibleMoves.filter(m => !m.name.startsWith(`MOVE ${(8+yourLocation-1)%8}`));
      }
  
  possibleMoves = possibleMoves.sort((a,b) => slotCost(a.slot) - slotCost(b.slot));
  // console.error(possibleMoves);


  if(app) {
      const bestMove = choseBestMove2(myHand, app, possibleMoves, myLocation);
      if(bestMove !== undefined) {
          doMove(bestMove);
          return;        
      }
  }
  
  if(possibleMoves.length) { doMove(possibleMoves.pop()); return; }
  
  let newLocation = (1 + getRandomInt(7) + myLocation) % 8;
  if (newLocation === yourLocation) newLocation = (newLocation + 1) % 8;
  if (newLocation === myLocation) newLocation = (newLocation + 1) % 8;
  console.log(`MOVE ${newLocation}`);
}

function availableSlot(m) {
  //return true;
  const c = cardTypesUp[m.target];
  const res = (pickedCard[c] || 0) < 5;
  if(!res) console.error('SKIP empty', c);
  return res;
}

function doMove(m) {
  const c = cardTypesUp[m.target];
  pickedCard[c] = 1 + (pickedCard[c] ?? 0);
  console.log(m.name);
}

function moveA() {
  console.error("moveA");
  console.error(playedCard);
  console.error(playedCardApp);
  let quickMoves = possibleMoves.filter(m => m.name.startsWith('MOVE'));
  quickMoves = quickMoves.filter(m => availableSlot(m));
  quickMoves = quickMoves.filter(m => !m.name.startsWith(`MOVE ${myLocation}`));
  quickMoves = quickMoves.filter(m => !m.name.startsWith(`MOVE ${yourLocation}`));
  quickMoves = quickMoves.filter(m => !m.name.startsWith(`MOVE ${(yourLocation+1)%8}`));
  quickMoves = quickMoves.filter(m => !m.name.startsWith(`MOVE ${(8+yourLocation-1)%8}`));
  quickMoves = quickMoves.filter(m => {
      if((playedCard.DAILY_ROUTINE || 0) < 1 && m.target === 2) return true;
      //if((playedCard.ARCHITECTURE_STUDY || 0) < 1 && m.target === 4) return true;
      //if((playedCard.CODE_REVIEW || 0) < 1 && m.target === 6) return true;
      if((playedCard.CONTINUOUS_INTEGRATION || 0) < 1 && m.target === 5) return true;
  });

  if(quickMoves.length) {
      doMove(quickMoves[0]);
      return;
  }
  move0();
}

function moveWeight1(m) {
  if(m.target === 5 && slotCost(m.target) <= 3) return 1.0; //CONTINUOUS_INTEGRATION
  if(m.target === 2 && slotCost(m.target) <= 3) return 2.0; //DAILY_ROUTINE
  if(m.target === 4 && (playedCardApp.ARCHITECTURE_STUDY || 0) < 1 && slotCost(m.target) <= 2) return 3.0; //ARCHITECTURE_STUDY
  if(m.target === 6 && (playedCardApp.CODE_REVIEW || 0) < 1 && slotCost(m.target) <= 2) return 4.0; //CODE_REVIEW
  if(m.target === 0 && (playedCardApp.TRAINING || 0) < 1 && slotCost(m.target) <= 2) return 5.0; //TRAINING
  /*
  if(players[0].playerScore >= 4) {
      if(slotCost(3) <= 3 && m.target === 3) return 1.0;
  }
  */
  return 100.0;
}

function moveWeight2(m) {
  if(m.target === 5 && (playedCardApp.CONTINUOUS_INTEGRATION || 0) < 3) return 1.0; //CONTINUOUS_INTEGRATION
  if(m.target === 2 && (playedCardApp.DAILY_ROUTINE || 0) < 3) return 2.0; //DAILY_ROUTINE
  if(m.target === 4 && (playedCardApp.ARCHITECTURE_STUDY || 0) < 3) return 3.0; //ARCHITECTURE_STUDY
  if(m.target === 6 && (playedCardApp.CODE_REVIEW || 0) < 1) return 4.0; //CODE_REVIEW
  //if(m.target === 0 && (playedCardApp.TRAINING || 0) < 1 ) return 5.0; //TRAINING
/*    
  if(players[0].playerScore >= 4) {
      if(m.target === 3 && (playedCardApp.TASK_PRIORITIZATION || 0) < 1) return 6.0; //TASK_PRIORITIZATION
  }
*/    
  return 100.0;
}

function moveSlotWeight(m) {
  return moveWeight2(m) * slotCost(m.slot);
}


function moveB() {
  console.error("moveB");
  console.error(playedCard);
  console.error(playedCardApp);
  console.error(pickedCard);
  let quickMoves = possibleMoves.filter(m => m.name.startsWith('MOVE'));
  quickMoves = quickMoves.filter(m => availableSlot(m));
  quickMoves = quickMoves.filter(m => !m.name.startsWith(`MOVE ${myLocation}`));
  quickMoves = quickMoves.filter(m => !m.name.startsWith(`MOVE ${yourLocation}`));
  quickMoves = quickMoves.filter(m => !m.name.startsWith(`MOVE ${(yourLocation+1)%8}`));
  quickMoves = quickMoves.filter(m => !m.name.startsWith(`MOVE ${(8+yourLocation-1)%8}`));
  quickMoves = quickMoves.filter(m => moveWeight2(m) < 100.0);
  quickMoves = quickMoves.sort( (a,b) => moveSlotWeight(a) - moveSlotWeight(b));

  if(quickMoves.length) {
      doMove(quickMoves[0]);
      return;
  }
  move0();
}

function taskPrio(good) {
  const app = bestApp();

  let bestPrio;
  console.error(app);

  cardTypes.forEach( (c, i) => {
      good.forEach( m => {
          const targets = m.name.slice('TASK_PRIORITIZATION '.length).split(' ');
          const source = parseInt(targets[0]);
          const target = parseInt(targets[1]);
          if(!app[cardTypes[source]] && app[cardTypes[target]]) bestPrio = m;
      });
  });

  console.error(`bestPrio = ${bestPrio}`);
  if(bestPrio === undefined) return false;
  //return possibleMoves.filter(m => m.target === bestMove)[0].name;

  playCard(bestPrio.name);
  return true;
}

function playCard(app, move) {
  card = move.split(' ')[0];
  slot = cardSlots[card];
  const c = cardTypes[slot];
  console.error(card);
  console.error(c);
  if(0 && players[0].playerScore >= 4 && app[c]) {
      console.error("SKIP", c);
      return false;
  }
  
  playedCard[card] = 1 + (playedCard[card] ?? 0);
  playedCardApp[card] = 1 + (playedCardApp[card] ?? 0);
  console.log(move);
  return true;
}

while (true) {


  gamePhase = _readline(),
      nApplications = parseInt(_readline()),
      applications = [...Array(nApplications)].map(_ => new Application(_readline().split(' '))),
      players = [...Array(2)].map(_ => new Player(_readline().split(' '))),
      nCardLocations = parseInt(_readline()),
      cardsLocations = [...Array(nCardLocations)].map(_ => new Card(_readline().split(' '))),
      nPossibleMoves = parseInt(_readline()),
      possibleMoves  = [...Array(nPossibleMoves)].map(_ => new Move(_readline()));

  hands = {};
  cardsLocations.forEach( c => {
      hands[c.cardsLocation] = c;
  });
  myHand = hands['HAND']
  myLocation = players[0].playerLocation;
  yourLocation = players[1].playerLocation;
  const app = bestApp();
  // console.error(applications);
  // console.error(cardsLocations);
  switch(gamePhase) {
      case 'MOVE':
          // console.error(myHand);
          // if(players[0].playerScore <= 1)
          if(myLocation === -1)
          {
              moveA();
              break;
          }
          if(players[0].playerScore <= 5) {
              moveB();
              break;
          }
          move0();
          break;
  case 'RELEASE':
          playedCardApp = {}
          good = possibleMoves.filter(m => m.name.startsWith('RELEASE'));
          if(good.length) { console.log(good.pop().name); break; }
          console.log('RANDOM');
          break;            
      case 'GIVE_CARD': 
          good = possibleMoves.filter(m => m.name.startsWith('GIVE 9'));
          if(good.length) { console.log(good.pop().name); break; }
          medium = possibleMoves.filter(m => !m.name.startsWith('RANDOM') && !m.name.startsWith('WAIT'));
          if(medium.length) { console.log(medium.pop().name); break; }
          console.log('RANDOM');
          break;
      case 'THROW_CARD': 
          good = possibleMoves.filter(m => m.name.startsWith('THROW 8'));
          if(good.length) { console.log(good.pop().name); break; }
          console.log('RANDOM');
          break;
      case 'PLAY_CARD': 
          /*
          if(players[0].playerScore>=4) {
              console.log('WAIT');
              break;    
          }
          */

          //if((playedCard.CONTINUOUS_INTEGRATION || 0) < 2) 
          {
              good = possibleMoves.filter(m => m.name.startsWith('CONTINUOUS_INTEGRATION'));
              if(good.length && playCard(app, good.pop().name)) break;
          }
          
          //if((playedCard.DAILY_ROUTINE || 0) < 4) 
          {
              good = possibleMoves.filter(m => m.name.startsWith('DAILY_ROUTINE'));
              if(good.length && playCard(app, good.pop().name)) break;
          }
          
          //if((playedCard.ARCHITECTURE_STUDY || 0) < 5) 
          {
              good = possibleMoves.filter(m => m.name.startsWith('ARCHITECTURE_STUDY'));
              if(good.length && playCard(app, good.pop().name)) break;
          }
          
          //if((playedCardApp.CODE_REVIEW || 0) < 1) 
          if(players[0].playerScore<=4) {
              good = possibleMoves.filter(m => m.name.startsWith('CODE_REVIEW'));
              if(good.length && playCard(app, good.pop().name)) break;
          }

/*
          if(players[0].playerScore >= 4) {
              good = possibleMoves.filter(m => m.name.startsWith('TASK_PRIORITIZATION'));
              if(good.length && taskPrio(good)) { break; }
          }
*/
          console.log('WAIT');
          break;


          //if((playedCardApp.TRAINING || 0) < 0) 
          if(players[0].playerScore>=40000) 
          {
              good = possibleMoves.filter(m => m.name.startsWith('TRAINING'));
              if(good.length) { playCard(good.pop().name); break; }
          }


          console.log('WAIT');
          break;

          good = possibleMoves.filter(m => m.name.startsWith('REFACTORING'));
          if(good.length) { playCard(good.pop().name); break; }
          medium = possibleMoves.filter(m => !m.name.startsWith('RANDOM') && !m.name.startsWith('WAIT'));
          if(medium.length) { playCard(medium.pop().name); break; }
          console.log('WAIT');
          break;
      default:
          medium = possibleMoves.filter(m => !m.name.startsWith('RANDOM') && !m.name.startsWith('WAIT'));
          if(medium.length) { console.log(medium.pop().name); break; }
          console.log('RANDOM');
          break;
  }
}
