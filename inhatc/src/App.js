import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table"
import { Badge } from "./components/ui/badge"
import { Progress } from "./components/ui/progress"
import { Skeleton } from "./components/ui/skeleton"
import { TrendingUp, Users, Target, BarChart3 } from "lucide-react"

function getCompetitionBadgeColor(rate) {
  if (rate >= 50) return "destructive"
  if (rate >= 20) return "secondary"
  if (rate >= 10) return "outline"
  return "default"
}

export default function App() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("http://localhost:8000/crawl")
      .then((res) => res.json())
      .then((res) => {
        setData(res.data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("데이터 불러오기 실패:", err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 전형별 그룹화
  const grouped = data.reduce((acc, cur) => {
    if (!acc[cur.전형명]) acc[cur.전형명] = []
    acc[cur.전형명].push(cur)
    return acc
  }, {})

  // 통계
  const totalApplicants = data.reduce((sum, item) => sum + item.지원자수, 0)
  const totalCapacity = data.reduce((sum, item) => sum + item.모집인원, 0)
  const avgCompetitionRate =
    data.length > 0 ? data.reduce((sum, item) => sum + item.경쟁률, 0) / data.length : 0
  const highestCompetitionRate = data.length > 0 ? Math.max(...data.map((item) => item.경쟁률)) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-7xl p-6 space-y-8">
        {/* 헤더 */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                2026학년도 학과별 경쟁률 현황
              </h1>
              <p className="text-muted-foreground mt-1">
                실시간 입학 경쟁률 및 지원 현황을 확인하세요
              </p>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">총 지원자수</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                {totalApplicants.toLocaleString()}명
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">총 모집인원</CardTitle>
              <Target className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {totalCapacity.toLocaleString()}명
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">평균 경쟁률</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">
                {avgCompetitionRate.toFixed(1)}:1
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">최고 경쟁률</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">
                {highestCompetitionRate.toFixed(1)}:1
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 전형별 테이블 */}
        {Object.keys(grouped).map((전형명) => (
          <Card key={전형명} className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span>{전형명}</span>
                <Badge
                  variant="secondary"
                  className="ml-auto bg-white/20 text-white border-white/30"
                >
                  {grouped[전형명].length}개 학과
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>계열</TableHead>
                      <TableHead>학과</TableHead>
                      <TableHead className="text-right">모집인원</TableHead>
                      <TableHead className="text-right">지원자수</TableHead>
                      <TableHead className="text-center">경쟁률</TableHead>
                      <TableHead>지원율</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grouped[전형명].map((row, idx) => {
                      const percent =
                        row.모집인원 > 0
                          ? Math.round((row.지원자수 / row.모집인원) * 100)
                          : 0
                      return (
                        <TableRow key={idx}>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {row.계열}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-slate-900">
                            {row.학과}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {row.모집인원.toLocaleString()}명
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {row.지원자수.toLocaleString()}명
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={getCompetitionBadgeColor(row.경쟁률)}
                              className="font-bold"
                            >
                              {row.경쟁률.toFixed(1)}:1
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs text-slate-600">
                                <span>지원율</span>
                                <span className="font-semibold">{percent}%</span>
                              </div>
                              <Progress value={Math.min(100, percent)} className="h-2" />
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            * 경쟁률은 실시간으로 업데이트되며, 최종 경쟁률과 다를 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  )
}
