import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Progress } from "../../components/ui/progress";

interface MatchStatsProps {
  matchData: any;
  sportSlug: string | undefined;
}

const MatchStats = ({ matchData, sportSlug }: MatchStatsProps) => {
  if (!matchData) return <div>Match data not available</div>;
  
  // Handle different data formats based on sport type
  if (sportSlug === 'cricket') {
    return <CricketStats matchData={matchData} />;
  }
  
  return <GenericStats matchData={matchData} />;
};

const CricketStats = ({ matchData }: { matchData: any }) => {
  // Extract and prepare cricket stats data
  const teams = matchData.teamInfo || [];
  const score = matchData.score || [];
  
  // Demo stats (in a real app these would come from the match data)
  const team1Stats = {
    runs: score[0]?.r || 180,
    wickets: score[0]?.w || 4,
    overs: score[0]?.o || 20,
    runRate: parseFloat(score[0]?.o) > 0 ? (score[0]?.r / parseFloat(score[0]?.o)).toFixed(2) : '9.00',
    boundaries: 12,
    sixes: 8,
    dotBalls: 40,
    extras: 10
  };
  
  const team2Stats = {
    runs: score[1]?.r || 165,
    wickets: score[1]?.w || 8,
    overs: score[1]?.o || 20,
    runRate: parseFloat(score[1]?.o) > 0 ? (score[1]?.r / parseFloat(score[1]?.o)).toFixed(2) : '8.25',
    boundaries: 10,
    sixes: 6,
    dotBalls: 45,
    extras: 8
  };
  
  // Calculate percentages for comparison
  const totalRuns = team1Stats.runs + team2Stats.runs;
  const totalBoundaries = team1Stats.boundaries + team2Stats.boundaries;
  const totalSixes = team1Stats.sixes + team2Stats.sixes;
  const totalDotBalls = team1Stats.dotBalls + team2Stats.dotBalls;
  
  return (
    <div className="space-y-6">
      {/* Basic Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Match Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {/* Runs */}
            <div>
              <div className="flex justify-between mb-1">
                <div className="font-medium text-sm">{team1Stats.runs}</div>
                <div className="font-medium">Runs</div>
                <div className="font-medium text-sm">{team2Stats.runs}</div>
              </div>
              <div className="flex items-center">
                <Progress
                  value={(team1Stats.runs / totalRuns) * 100}
                  className="h-2 flex-1"
                />
                <div className="w-1 h-2"></div>
                <Progress
                  value={(team2Stats.runs / totalRuns) * 100}
                  className="h-2 flex-1 bg-blue-500/20 [&>div]:bg-blue-500"
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <div>{teams[0]?.name || 'Team 1'}</div>
                <div>{teams[1]?.name || 'Team 2'}</div>
              </div>
            </div>
            
            {/* Run Rate */}
            <div>
              <div className="flex justify-between mb-1">
                <div className="font-medium text-sm">{team1Stats.runRate}</div>
                <div className="font-medium">Run Rate</div>
                <div className="font-medium text-sm">{team2Stats.runRate}</div>
              </div>
              <div className="flex items-center">
                <Progress
                  value={(parseFloat(team1Stats.runRate) / (parseFloat(team1Stats.runRate) + parseFloat(team2Stats.runRate))) * 100}
                  className="h-2 flex-1"
                />
                <div className="w-1 h-2"></div>
                <Progress
                  value={(parseFloat(team2Stats.runRate) / (parseFloat(team1Stats.runRate) + parseFloat(team2Stats.runRate))) * 100}
                  className="h-2 flex-1 bg-blue-500/20 [&>div]:bg-blue-500"
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <div>{teams[0]?.name || 'Team 1'}</div>
                <div>{teams[1]?.name || 'Team 2'}</div>
              </div>
            </div>
            
            {/* Boundaries */}
            <div>
              <div className="flex justify-between mb-1">
                <div className="font-medium text-sm">{team1Stats.boundaries}</div>
                <div className="font-medium">Boundaries (4s)</div>
                <div className="font-medium text-sm">{team2Stats.boundaries}</div>
              </div>
              <div className="flex items-center">
                <Progress
                  value={(team1Stats.boundaries / totalBoundaries) * 100}
                  className="h-2 flex-1"
                />
                <div className="w-1 h-2"></div>
                <Progress
                  value={(team2Stats.boundaries / totalBoundaries) * 100}
                  className="h-2 flex-1 bg-blue-500/20 [&>div]:bg-blue-500"
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <div>{teams[0]?.name || 'Team 1'}</div>
                <div>{teams[1]?.name || 'Team 2'}</div>
              </div>
            </div>
            
            {/* Sixes */}
            <div>
              <div className="flex justify-between mb-1">
                <div className="font-medium text-sm">{team1Stats.sixes}</div>
                <div className="font-medium">Sixes (6s)</div>
                <div className="font-medium text-sm">{team2Stats.sixes}</div>
              </div>
              <div className="flex items-center">
                <Progress
                  value={(team1Stats.sixes / totalSixes) * 100}
                  className="h-2 flex-1"
                />
                <div className="w-1 h-2"></div>
                <Progress
                  value={(team2Stats.sixes / totalSixes) * 100}
                  className="h-2 flex-1 bg-blue-500/20 [&>div]:bg-blue-500"
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <div>{teams[0]?.name || 'Team 1'}</div>
                <div>{teams[1]?.name || 'Team 2'}</div>
              </div>
            </div>
            
            {/* Dot Balls */}
            <div>
              <div className="flex justify-between mb-1">
                <div className="font-medium text-sm">{team1Stats.dotBalls}</div>
                <div className="font-medium">Dot Balls</div>
                <div className="font-medium text-sm">{team2Stats.dotBalls}</div>
              </div>
              <div className="flex items-center">
                <Progress
                  value={(team1Stats.dotBalls / totalDotBalls) * 100}
                  className="h-2 flex-1"
                />
                <div className="w-1 h-2"></div>
                <Progress
                  value={(team2Stats.dotBalls / totalDotBalls) * 100}
                  className="h-2 flex-1 bg-blue-500/20 [&>div]:bg-blue-500"
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <div>{teams[0]?.name || 'Team 1'}</div>
                <div>{teams[1]?.name || 'Team 2'}</div>
              </div>
            </div>
            
            {/* Extras */}
            <div>
              <div className="flex justify-between mb-1">
                <div className="font-medium text-sm">{team1Stats.extras}</div>
                <div className="font-medium">Extras</div>
                <div className="font-medium text-sm">{team2Stats.extras}</div>
              </div>
              <div className="flex items-center">
                <Progress
                  value={(team1Stats.extras / (team1Stats.extras + team2Stats.extras)) * 100}
                  className="h-2 flex-1"
                />
                <div className="w-1 h-2"></div>
                <Progress
                  value={(team2Stats.extras / (team1Stats.extras + team2Stats.extras)) * 100}
                  className="h-2 flex-1 bg-blue-500/20 [&>div]:bg-blue-500"
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <div>{teams[0]?.name || 'Team 1'}</div>
                <div>{teams[1]?.name || 'Team 2'}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Wagon Wheel & Other Cricket Visualizations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Scoring Areas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-square relative bg-muted rounded-full overflow-hidden flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              Wagon wheel visualization<br />
              (Requires integration with cricket data provider)
            </div>
            {/* This would normally be an SVG visualization of a cricket field showing where runs are scored */}
          </div>
        </CardContent>
      </Card>
      
      {/* Partnership Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Partnership Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs>
            <TabsList className="mb-4">
              <TabsTrigger value="team1">{teams[0]?.name || 'Team 1'}</TabsTrigger>
              <TabsTrigger value="team2">{teams[1]?.name || 'Team 2'}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="team1">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">Batsmen</th>
                    <th className="p-2 text-center">Runs</th>
                    <th className="p-2 text-center">Balls</th>
                    <th className="p-2 text-center">SR</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { batsmen: 'Player 1 & Player 2', runs: 42, balls: 30, sr: 140 },
                    { batsmen: 'Player 2 & Player 3', runs: 65, balls: 45, sr: 144.4 },
                    { batsmen: 'Player 3 & Player 4', runs: 38, balls: 25, sr: 152 },
                    { batsmen: 'Player 4 & Player 5', runs: 35, balls: 20, sr: 175 }
                  ].map((partnership, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                      <td className="p-2 font-medium">{partnership.batsmen}</td>
                      <td className="p-2 text-center">{partnership.runs}</td>
                      <td className="p-2 text-center">{partnership.balls}</td>
                      <td className="p-2 text-center">{partnership.sr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TabsContent>
            
            <TabsContent value="team2">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">Batsmen</th>
                    <th className="p-2 text-center">Runs</th>
                    <th className="p-2 text-center">Balls</th>
                    <th className="p-2 text-center">SR</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { batsmen: 'Player A & Player B', runs: 38, balls: 30, sr: 126.7 },
                    { batsmen: 'Player B & Player C', runs: 55, balls: 45, sr: 122.2 },
                    { batsmen: 'Player C & Player D', runs: 42, balls: 30, sr: 140 },
                    { batsmen: 'Player D & Player E', runs: 30, balls: 15, sr: 200 }
                  ].map((partnership, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                      <td className="p-2 font-medium">{partnership.batsmen}</td>
                      <td className="p-2 text-center">{partnership.runs}</td>
                      <td className="p-2 text-center">{partnership.balls}</td>
                      <td className="p-2 text-center">{partnership.sr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

const GenericStats = ({ matchData }: { matchData: any }) => {
  // For sports like football, basketball, etc.
  const homeTeam = matchData.homeTeam || { name: 'Home Team' };
  const awayTeam = matchData.awayTeam || { name: 'Away Team' };
  
  // Demo stats (in a real app these would come from the match data)
  const stats = [
    { name: 'Possession', home: 55, away: 45 },
    { name: 'Shots', home: 15, away: 10 },
    { name: 'Shots on Target', home: 7, away: 4 },
    { name: 'Corners', home: 8, away: 5 },
    { name: 'Fouls', home: 12, away: 15 },
    { name: 'Yellow Cards', home: 2, away: 3 },
    { name: 'Red Cards', home: 0, away: 0 },
    { name: 'Offsides', home: 3, away: 2 },
    { name: 'Passes', home: 450, away: 380 },
    { name: 'Pass Accuracy', home: 85, away: 80 }
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Match Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.map((stat, index) => (
            <div key={index}>
              <div className="flex justify-between mb-1">
                <div className="font-medium text-sm">{stat.home}</div>
                <div className="font-medium">{stat.name}</div>
                <div className="font-medium text-sm">{stat.away}</div>
              </div>
              <div className="flex items-center">
                <Progress
                  value={(stat.home / (stat.home + stat.away)) * 100}
                  className="h-2 flex-1"
                />
                <div className="w-1 h-2"></div>
                <Progress
                  value={(stat.away / (stat.home + stat.away)) * 100}
                  className="h-2 flex-1 bg-blue-500/20 [&>div]:bg-blue-500"
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <div>{homeTeam.name}</div>
                <div>{awayTeam.name}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Custom Tabs component for this file since we need to fix some TypeScript errors with the imported component
const Tabs = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="tabs">
      {children}
    </div>
  );
};

const TabsList = ({ className, children }: { className?: string, children: React.ReactNode }) => {
  return (
    <div className={`flex space-x-1 rounded-md bg-muted p-1 ${className || ''}`}>
      {children}
    </div>
  );
};

const TabsTrigger = ({ value, children }: { value: string, children: React.ReactNode }) => {
  return (
    <button
      className="flex-1 rounded-sm px-3 py-1.5 text-sm font-medium bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
      data-state={value === 'team1' ? 'active' : 'inactive'}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, children }: { value: string, children: React.ReactNode }) => {
  return (
    <div className="mt-2" data-state={value === 'team1' ? 'active' : 'inactive'}>
      {children}
    </div>
  );
};

export default MatchStats;
