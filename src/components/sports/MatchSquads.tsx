import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

interface MatchSquadsProps {
  matchData: any;
  sportSlug: string | undefined;
}

const MatchSquads = ({ matchData, sportSlug }: MatchSquadsProps) => {
  if (!matchData) return <div>Match data not available</div>;
  
  // Handle different data formats based on sport type
  if (sportSlug === 'cricket') {
    return <CricketSquads matchData={matchData} />;
  }
  
  return <GenericSquads matchData={matchData} />;
};

const CricketSquads = ({ matchData }: { matchData: any }) => {
  const teams = matchData.teamInfo || [];
  const squads = matchData.squads || matchData.teamSquads || [];
  const team1Players = squads[0]?.players || teams[0]?.players || [];
  const team2Players = squads[1]?.players || teams[1]?.players || [];
  
  return (
    <Tabs defaultValue="team1" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="team1">{teams[0]?.name || 'Team 1'}</TabsTrigger>
        <TabsTrigger value="team2">{teams[1]?.name || 'Team 2'}</TabsTrigger>
      </TabsList>
      
      <TabsContent value="team1">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {teams[0]?.img && (
                <img src={teams[0].img} alt={teams[0].name} className="w-6 h-6" />
              )}
              {teams[0]?.name || 'Team 1'} Squad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Batsmen */}
              <div>
                <h3 className="font-medium text-sm mb-2">Batsmen</h3>
                <ul className="space-y-2">
                  {team1Players
                    .filter(player => player.role === 'Batsman')
                    .map((player, index) => (
                      <li key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                          {player.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-xs text-muted-foreground">{player.role}</div>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
              
              {/* Bowlers */}
              <div>
                <h3 className="font-medium text-sm mb-2">Bowlers</h3>
                <ul className="space-y-2">
                  {team1Players
                    .filter(player => player.role === 'Bowler')
                    .map((player, index) => (
                      <li key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                          {player.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-xs text-muted-foreground">{player.role}</div>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
              
              {/* All-rounders */}
              <div>
                <h3 className="font-medium text-sm mb-2">All-rounders</h3>
                <ul className="space-y-2">
                  {team1Players
                    .filter(player => player.role === 'All-rounder')
                    .map((player, index) => (
                      <li key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                          {player.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-xs text-muted-foreground">{player.role}</div>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
              
              {/* Wicketkeepers */}
              <div>
                <h3 className="font-medium text-sm mb-2">Wicketkeepers</h3>
                <ul className="space-y-2">
                  {team1Players
                    .filter(player => player.role === 'Wicketkeeper')
                    .map((player, index) => (
                      <li key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                          {player.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-xs text-muted-foreground">{player.role}</div>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="team2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {teams[1]?.img && (
                <img src={teams[1].img} alt={teams[1].name} className="w-6 h-6" />
              )}
              {teams[1]?.name || 'Team 2'} Squad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Batsmen */}
              <div>
                <h3 className="font-medium text-sm mb-2">Batsmen</h3>
                <ul className="space-y-2">
                  {team2Players
                    .filter(player => player.role === 'Batsman')
                    .map((player, index) => (
                      <li key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                          {player.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-xs text-muted-foreground">{player.role}</div>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
              
              {/* Bowlers */}
              <div>
                <h3 className="font-medium text-sm mb-2">Bowlers</h3>
                <ul className="space-y-2">
                  {team2Players
                    .filter(player => player.role === 'Bowler')
                    .map((player, index) => (
                      <li key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                          {player.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-xs text-muted-foreground">{player.role}</div>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
              
              {/* All-rounders */}
              <div>
                <h3 className="font-medium text-sm mb-2">All-rounders</h3>
                <ul className="space-y-2">
                  {team2Players
                    .filter(player => player.role === 'All-rounder')
                    .map((player, index) => (
                      <li key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                          {player.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-xs text-muted-foreground">{player.role}</div>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
              
              {/* Wicketkeepers */}
              <div>
                <h3 className="font-medium text-sm mb-2">Wicketkeepers</h3>
                <ul className="space-y-2">
                  {team2Players
                    .filter(player => player.role === 'Wicketkeeper')
                    .map((player, index) => (
                      <li key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                          {player.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-xs text-muted-foreground">{player.role}</div>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

const GenericSquads = ({ matchData }: { matchData: any }) => {
  const homeTeam = matchData.homeTeam || { name: 'Home Team' };
  const awayTeam = matchData.awayTeam || { name: 'Away Team' };
  
  // Generate demo squads if they don't exist in the data
  const homeSquad = matchData.homeSquad || homeTeam.players || [];
  const awaySquad = matchData.awaySquad || awayTeam.players || [];
  
  return (
    <Tabs defaultValue="home" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="home">{homeTeam.name}</TabsTrigger>
        <TabsTrigger value="away">{awayTeam.name}</TabsTrigger>
      </TabsList>
      
      <TabsContent value="home">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {homeTeam.logo && (
                <img src={homeTeam.logo} alt={homeTeam.name} className="w-6 h-6" />
              )}
              {homeTeam.name} Squad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Starting XI */}
              <div>
                <h3 className="font-medium text-sm mb-2">Starting XI</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {homeSquad
                    .filter(player => player.starting)
                    .map((player, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                        <div className="min-w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                          {player.number}
                        </div>
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-xs text-muted-foreground">{player.role}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              
              {/* Substitutes */}
              <div>
                <h3 className="font-medium text-sm mb-2">Substitutes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {homeSquad
                    .filter(player => !player.starting)
                    .map((player, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                        <div className="min-w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                          {player.number}
                        </div>
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-xs text-muted-foreground">{player.role}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              
              {/* Coach */}
              <div className="p-2 bg-muted/30 rounded-md">
                <h3 className="font-medium text-sm mb-1">Coach</h3>
                <div className="font-medium">John Smith</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="away">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {awayTeam.logo && (
                <img src={awayTeam.logo} alt={awayTeam.name} className="w-6 h-6" />
              )}
              {awayTeam.name} Squad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Starting XI */}
              <div>
                <h3 className="font-medium text-sm mb-2">Starting XI</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {awaySquad
                    .filter(player => player.starting)
                    .map((player, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                        <div className="min-w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                          {player.number}
                        </div>
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-xs text-muted-foreground">{player.role}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              
              {/* Substitutes */}
              <div>
                <h3 className="font-medium text-sm mb-2">Substitutes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {awaySquad
                    .filter(player => !player.starting)
                    .map((player, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                        <div className="min-w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                          {player.number}
                        </div>
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-xs text-muted-foreground">{player.role}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              
              {/* Coach */}
              <div className="p-2 bg-muted/30 rounded-md">
                <h3 className="font-medium text-sm mb-1">Coach</h3>
                <div className="font-medium">Michael Johnson</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

// Helper function to generate mock squad data
const generateDemoSquad = (sport: string, teamName: string) => {
  if (sport === 'cricket') {
    // Cricket players
    const indianPlayers = [
      { name: 'Rohit Sharma', role: 'Batsman' },
      { name: 'KL Rahul', role: 'Batsman' },
      { name: 'Virat Kohli', role: 'Batsman' },
      { name: 'Shreyas Iyer', role: 'Batsman' },
      { name: 'Rishabh Pant', role: 'Wicketkeeper' },
      { name: 'Hardik Pandya', role: 'All-rounder' },
      { name: 'Ravindra Jadeja', role: 'All-rounder' },
      { name: 'R Ashwin', role: 'Bowler' },
      { name: 'Jasprit Bumrah', role: 'Bowler' },
      { name: 'Mohammed Shami', role: 'Bowler' },
      { name: 'Yuzvendra Chahal', role: 'Bowler' }
    ];
    
    const australianPlayers = [
      { name: 'David Warner', role: 'Batsman' },
      { name: 'Steve Smith', role: 'Batsman' },
      { name: 'Marnus Labuschagne', role: 'Batsman' },
      { name: 'Glenn Maxwell', role: 'Batsman' },
      { name: 'Alex Carey', role: 'Wicketkeeper' },
      { name: 'Cameron Green', role: 'All-rounder' },
      { name: 'Pat Cummins', role: 'Bowler' },
      { name: 'Mitchell Starc', role: 'Bowler' },
      { name: 'Josh Hazlewood', role: 'Bowler' },
      { name: 'Adam Zampa', role: 'Bowler' },
      { name: 'Nathan Lyon', role: 'Bowler' }
    ];
    
    const englishPlayers = [
      { name: 'Joe Root', role: 'Batsman' },
      { name: 'Jonny Bairstow', role: 'Batsman' },
      { name: 'Ben Stokes', role: 'All-rounder' },
      { name: 'Jos Buttler', role: 'Wicketkeeper' },
      { name: 'Eoin Morgan', role: 'Batsman' },
      { name: 'Moeen Ali', role: 'All-rounder' },
      { name: 'Chris Woakes', role: 'All-rounder' },
      { name: 'Jofra Archer', role: 'Bowler' },
      { name: 'Stuart Broad', role: 'Bowler' },
      { name: 'James Anderson', role: 'Bowler' },
      { name: 'Adil Rashid', role: 'Bowler' }
    ];
    
    if (teamName.includes('India')) return indianPlayers;
    if (teamName.includes('Australia')) return australianPlayers;
    if (teamName.includes('England')) return englishPlayers;
    
    // Generic players if team name doesn't match
    return [
      { name: 'Player 1', role: 'Batsman' },
      { name: 'Player 2', role: 'Batsman' },
      { name: 'Player 3', role: 'Batsman' },
      { name: 'Player 4', role: 'Batsman' },
      { name: 'Player 5', role: 'Wicketkeeper' },
      { name: 'Player 6', role: 'All-rounder' },
      { name: 'Player 7', role: 'All-rounder' },
      { name: 'Player 8', role: 'Bowler' },
      { name: 'Player 9', role: 'Bowler' },
      { name: 'Player 10', role: 'Bowler' },
      { name: 'Player 11', role: 'Bowler' }
    ];
  } else {
    // Football/soccer players
    const players = [];
    
    // Generate 11 starters
    for (let i = 1; i <= 11; i++) {
      let role = 'Midfielder';
      if (i === 1) role = 'Goalkeeper';
      else if (i >= 2 && i <= 5) role = 'Defender';
      else if (i >= 6 && i <= 8) role = 'Midfielder';
      else role = 'Forward';
      
      players.push({
        name: `${teamName} Player ${i}`,
        role,
        number: i,
        starting: true
      });
    }
    
    // Generate 7 substitutes
    for (let i = 12; i <= 18; i++) {
      let role = 'Midfielder';
      if (i === 12) role = 'Goalkeeper';
      else if (i >= 13 && i <= 14) role = 'Defender';
      else if (i >= 15 && i <= 16) role = 'Midfielder';
      else role = 'Forward';
      
      players.push({
        name: `${teamName} Player ${i}`,
        role,
        number: i,
        starting: false
      });
    }
    
    return players;
  }
};

export default MatchSquads;
