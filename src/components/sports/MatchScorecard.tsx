import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Badge } from "../../components/ui/badge";

interface MatchScorecardProps {
  scorecardData: any;
  sportSlug: string | undefined;
}

const MatchScorecard = ({ scorecardData, sportSlug }: MatchScorecardProps) => {
  if (!scorecardData) return <div>Scorecard data not available</div>;
  
  // Handle different data formats based on sport type
  if (sportSlug === 'cricket') {
    return <CricketScorecard scorecardData={scorecardData} />;
  }
  
  return <GenericScorecard scorecardData={scorecardData} />;
};

const CricketScorecard = ({ scorecardData }: { scorecardData: any }) => {
  const innings = scorecardData?.scorecard || [];
  
  if (!innings || innings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Scorecard data is not available yet</p>
      </div>
    );
  }
  
  return (
    <Tabs defaultValue="0" className="w-full">
      <TabsList className="mb-4">
        {innings.map((inning: any, index: number) => (
          <TabsTrigger key={index} value={index.toString()}>
            {inning.inning}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {innings.map((inning: any, index: number) => (
        <TabsContent key={index} value={index.toString()}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex justify-between items-center">
                <span>{inning.inning}</span>
                <span>{inning.runs}/{inning.wickets} ({inning.overs} ov)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Batting Table */}
              <div className="text-sm font-medium mb-2">Batting</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">Batter</th>
                      <th className="p-2 text-center">R</th>
                      <th className="p-2 text-center">B</th>
                      <th className="p-2 text-center">4s</th>
                      <th className="p-2 text-center">6s</th>
                      <th className="p-2 text-center">SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inning.batting && inning.batting.map((batter: any, idx: number) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                        <td className="p-2">
                          <div className="font-medium">{batter.batsman}</div>
                          <div className="text-xs text-muted-foreground">{batter.dismissal}</div>
                        </td>
                        <td className="p-2 text-center font-medium">{batter.r}</td>
                        <td className="p-2 text-center">{batter.b}</td>
                        <td className="p-2 text-center">{batter['4s']}</td>
                        <td className="p-2 text-center">{batter['6s']}</td>
                        <td className="p-2 text-center">{batter.sr}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/50">
                    <tr>
                      <td className="p-2 font-medium">Extras</td>
                      <td className="p-2 text-center" colSpan={5}>
                        {inning.extras?.total || 0} (b {inning.extras?.byes || 0}, lb {inning.extras?.legbyes || 0}, 
                        w {inning.extras?.wides || 0}, nb {inning.extras?.noballs || 0})
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">Total</td>
                      <td className="p-2 text-center font-bold" colSpan={5}>
                        {inning.runs}/{inning.wickets} ({inning.overs} Overs, RR: {inning.runrate})
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              {/* Fall of Wickets */}
              {inning.fow && inning.fow.length > 0 && (
                <div className="mt-6">
                  <div className="text-sm font-medium mb-2">Fall of Wickets</div>
                  <div className="p-3 bg-muted/30 rounded-md text-sm">
                    {inning.fow.map((fow: any, idx: number) => (
                      <span key={idx}>
                        {fow.score}-{fow.wicketNum} ({fow.batsman}, {fow.overs} ov)
                        {idx < inning.fow.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Bowling Table */}
              <div className="mt-6">
                <div className="text-sm font-medium mb-2">Bowling</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2">Bowler</th>
                        <th className="p-2 text-center">O</th>
                        <th className="p-2 text-center">M</th>
                        <th className="p-2 text-center">R</th>
                        <th className="p-2 text-center">W</th>
                        <th className="p-2 text-center">ECON</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inning.bowling && inning.bowling.map((bowler: any, idx: number) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                          <td className="p-2 font-medium">{bowler.bowler}</td>
                          <td className="p-2 text-center">{bowler.o}</td>
                          <td className="p-2 text-center">{bowler.m}</td>
                          <td className="p-2 text-center">{bowler.r}</td>
                          <td className="p-2 text-center font-medium">{bowler.w}</td>
                          <td className="p-2 text-center">{bowler.eco}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
};

const GenericScorecard = ({ scorecardData }: { scorecardData: any }) => {
  // For sports like football, basketball, etc.
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Match Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center py-4">
            <div className="flex flex-col items-center text-center">
              <img 
                src={scorecardData.homeTeam?.logo || "/placeholder-team.png"} 
                alt={scorecardData.homeTeam?.name} 
                className="w-16 h-16 mb-2" 
              />
              <div className="font-bold">{scorecardData.homeTeam?.name || 'Home Team'}</div>
              <div className="text-3xl font-bold mt-2">{scorecardData.scores?.home?.value || 0}</div>
            </div>
            
            <div className="text-xl font-light">vs</div>
            
            <div className="flex flex-col items-center text-center">
              <img 
                src={scorecardData.awayTeam?.logo || "/placeholder-team.png"} 
                alt={scorecardData.awayTeam?.name} 
                className="w-16 h-16 mb-2" 
              />
              <div className="font-bold">{scorecardData.awayTeam?.name || 'Away Team'}</div>
              <div className="text-3xl font-bold mt-2">{scorecardData.scores?.away?.value || 0}</div>
            </div>
          </div>
          
          {/* Period Scores */}
          {scorecardData.scores?.home?.periodScores && (
            <div className="mt-6">
              <div className="text-sm font-medium mb-2">Period Scores</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">Team</th>
                      {scorecardData.scores.home.periodScores.map((_: any, idx: number) => (
                        <th key={idx} className="p-2 text-center">
                          {['1st', '2nd', '3rd', '4th', 'OT'][idx] || `P${idx+1}`}
                        </th>
                      ))}
                      <th className="p-2 text-center">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-background">
                      <td className="p-2 font-medium">{scorecardData.homeTeam?.name}</td>
                      {scorecardData.scores.home.periodScores.map((period: any, idx: number) => (
                        <td key={idx} className="p-2 text-center">{period.value}</td>
                      ))}
                      <td className="p-2 text-center font-bold">{scorecardData.scores?.home?.value}</td>
                    </tr>
                    <tr className="bg-muted/30">
                      <td className="p-2 font-medium">{scorecardData.awayTeam?.name}</td>
                      {scorecardData.scores.away.periodScores.map((period: any, idx: number) => (
                        <td key={idx} className="p-2 text-center">{period.value}</td>
                      ))}
                      <td className="p-2 text-center font-bold">{scorecardData.scores?.away?.value}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Match Events (Goals, Cards, etc) for Football */}
          {scorecardData.footballData?.events && scorecardData.footballData.events.length > 0 && (
            <div className="mt-6">
              <div className="text-sm font-medium mb-2">Match Events</div>
              <div className="space-y-2">
                {scorecardData.footballData.events.map((event: any, idx: number) => {
                  const isHomeTeam = event.team === scorecardData.homeTeam._id;
                  
                  return (
                    <div key={idx} className={`flex items-center ${isHomeTeam ? 'justify-start' : 'justify-end'}`}>
                      {isHomeTeam ? (
                        <>
                          <Badge className={
                            event.type === 'goal' ? 'bg-green-600' :
                            event.type === 'yellow_card' ? 'bg-yellow-500' :
                            event.type === 'red_card' ? 'bg-red-600' :
                            'bg-blue-500'
                          }>
                            {event.minute}'
                          </Badge>
                          <span className="ml-2">
                            {event.type === 'goal' && '⚽ '}
                            {event.type === 'yellow_card' && '🟨 '}
                            {event.type === 'red_card' && '🟥 '}
                            {event.type === 'substitution' && '↔️ '}
                            {event.player}
                            {event.assistBy && ` (assist: ${event.assistBy})`}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="mr-2 text-right">
                            {event.player}
                            {event.assistBy && ` (assist: ${event.assistBy})`}
                            {event.type === 'goal' && ' ⚽'}
                            {event.type === 'yellow_card' && ' 🟨'}
                            {event.type === 'red_card' && ' 🟥'}
                            {event.type === 'substitution' && ' ↔️'}
                          </span>
                          <Badge className={
                            event.type === 'goal' ? 'bg-green-600' :
                            event.type === 'yellow_card' ? 'bg-yellow-500' :
                            event.type === 'red_card' ? 'bg-red-600' :
                            'bg-blue-500'
                          }>
                            {event.minute}'
                          </Badge>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchScorecard;
