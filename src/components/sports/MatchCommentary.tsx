import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

interface MatchCommentaryProps {
  matchData: any;
  sportSlug: string | undefined;
}

const MatchCommentary = ({ matchData, sportSlug }: MatchCommentaryProps) => {
  const [commentary, setCommentary] = useState<any[]>([]);
  
  useEffect(() => {
    // For demo purposes, we'll generate fake commentary
    // In a real app, this would come from the matchData or a separate API call
    const demoCommentary = generateDemoCommentary(sportSlug, matchData);
    setCommentary(demoCommentary);
  }, [sportSlug, matchData]);
  
  if (!matchData) return <div>Match data not available</div>;
  
  if (commentary.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Live commentary is not available for this match</p>
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Live Commentary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {commentary.map((comment, index) => (
            <div key={index} className="border-b border-gray-100 pb-3 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={
                  comment.type === 'wicket' ? 'bg-red-600' :
                  comment.type === 'boundary' ? 'bg-blue-600' :
                  comment.type === 'six' ? 'bg-purple-600' :
                  comment.type === 'goal' ? 'bg-green-600' :
                  comment.type === 'card' ? 'bg-yellow-500' :
                  'bg-gray-500'
                }>
                  {comment.time}
                </Badge>
                {comment.type === 'wicket' && <span className="font-bold text-red-600">WICKET!</span>}
                {comment.type === 'boundary' && <span className="font-bold text-blue-600">FOUR!</span>}
                {comment.type === 'six' && <span className="font-bold text-purple-600">SIX!</span>}
                {comment.type === 'goal' && <span className="font-bold text-green-600">GOAL!</span>}
                {comment.type === 'card' && <span className="font-bold text-yellow-600">{comment.cardType} CARD!</span>}
                {comment.highlight && <span className="font-bold">{comment.highlight}</span>}
              </div>
              <p className="text-sm">{comment.text}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to generate fake commentary for demo purposes
const generateDemoCommentary = (sportSlug: string | undefined, matchData: any) => {
  const commentary = [];
  const commentsCount = 20;
  
  if (sportSlug === 'cricket') {
    const team1 = matchData.teamInfo?.[0]?.name || 'Team 1';
    const team2 = matchData.teamInfo?.[1]?.name || 'Team 2';
    const batsmen = [
      'Rohit Sharma', 'Virat Kohli', 'KL Rahul', 'Shreyas Iyer', 'Rishabh Pant',
      'Steve Smith', 'Kane Williamson', 'Joe Root', 'Babar Azam', 'Shakib Al Hasan'
    ];
    const bowlers = [
      'Jasprit Bumrah', 'Mohammed Shami', 'Ravindra Jadeja', 'Pat Cummins',
      'Kagiso Rabada', 'Mitchell Starc', 'Trent Boult', 'Jofra Archer'
    ];
    
    // Create cricket commentary events
    for (let i = 0; i < commentsCount; i++) {
      const isEven = i % 2 === 0;
      const over = (19 - Math.floor(i / 6)).toString() + '.' + (i % 6 + 1);
      const batsman = batsmen[Math.floor(Math.random() * batsmen.length)];
      const bowler = bowlers[Math.floor(Math.random() * bowlers.length)];
      
      const commentTypes = ['regular', 'regular', 'regular', 'boundary', 'dot', 'wicket', 'six'];
      const commentType = commentTypes[Math.floor(Math.random() * commentTypes.length)];
      
      let commentText = '';
      let type = 'regular';
      let highlight = '';
      
      switch (commentType) {
        case 'regular':
          commentText = `${bowler} to ${batsman}, ${isEven ? 'pushes to mid-off for a single.' : 'no run, defended back to the bowler.'}`;
          break;
        case 'boundary':
          commentText = `${bowler} to ${batsman}, FOUR! ${isEven ? 'Beautifully timed through the covers.' : 'Pulled with power to the midwicket boundary.'}`;
          type = 'boundary';
          break;
        case 'dot':
          commentText = `${bowler} to ${batsman}, no run. ${isEven ? 'Good length delivery, defended carefully.' : 'Outside off, left alone by the batsman.'}`;
          break;
        case 'wicket':
          commentText = `${bowler} to ${batsman}, OUT! ${isEven ? 'Caught at slip! The batsman edges and it\'s a simple catch.' : 'BOWLED! The stumps are shattered, what a delivery!'}`;
          type = 'wicket';
          break;
        case 'six':
          commentText = `${bowler} to ${batsman}, SIX! ${isEven ? 'Massive hit over long-on, that\'s huge!' : 'Picked the length early and dispatched it over deep midwicket!'}`;
          type = 'six';
          break;
      }
      
      commentary.push({
        time: over,
        type,
        highlight,
        text: commentText
      });
    }
  } else {
    // Generic football/soccer commentary
    const team1 = matchData.homeTeam?.name || 'Home Team';
    const team2 = matchData.awayTeam?.name || 'Away Team';
    const players = [
      'Messi', 'Ronaldo', 'Mbappé', 'Haaland', 'Salah', 'De Bruyne',
      'Neymar', 'Lewandowski', 'Benzema', 'Kane', 'Modric', 'Neuer'
    ];
    
    for (let i = 0; i < commentsCount; i++) {
      const minute = 90 - i;
      const player = players[Math.floor(Math.random() * players.length)];
      const team = Math.random() > 0.5 ? team1 : team2;
      
      const commentTypes = ['regular', 'regular', 'chance', 'goal', 'card', 'regular'];
      const commentType = commentTypes[Math.floor(Math.random() * commentTypes.length)];
      
      let commentText = '';
      let type = 'regular';
      let highlight = '';
      let cardType = '';
      
      switch (commentType) {
        case 'regular':
          commentText = `${player} from ${team} ${Math.random() > 0.5 ? 'makes a good run down the wing.' : 'plays a precise pass to a teammate.'}`;
          break;
        case 'chance':
          commentText = `Chance for ${team}! ${player} ${Math.random() > 0.5 ? 'fires a shot just wide of the post.' : 'forces a great save from the goalkeeper!'}`;
          highlight = 'CHANCE!';
          break;
        case 'goal':
          commentText = `${player} scores for ${team}! ${Math.random() > 0.5 ? 'A clinical finish into the bottom corner!' : 'What a strike from outside the box!'}`;
          type = 'goal';
          break;
        case 'card':
          cardType = Math.random() > 0.8 ? 'RED' : 'YELLOW';
          commentText = `${cardType} card for ${player} of ${team}. ${cardType === 'YELLOW' ? 'A reckless tackle from behind.' : 'Straight red for a dangerous challenge!'}`;
          type = 'card';
          break;
      }
      
      commentary.push({
        time: `${minute}'`,
        type,
        highlight,
        cardType,
        text: commentText
      });
    }
  }
  
  return commentary.reverse(); // Most recent first
};

export default MatchCommentary;
