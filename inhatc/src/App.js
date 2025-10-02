import React, { useEffect, useState, useMemo } from "react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

// lucide-react 아이콘 임포트
import { TrendingUp, Users, Target, BarChart3, PieChart as PieChartIcon, Search, ArrowDownAZ, ArrowUpAZ, FilterX, ArrowUp, ArrowDown } from "lucide-react"

// --- Utility Functions (cn) ---
// Tailwind CSS 클래스 병합 유틸리티
function cn(...inputs) {
    return inputs.filter(Boolean).join(' ');
}

// --- UI Components ---

// Card Component
function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-white text-gray-900 shadow-md",
        className
      )}
      {...props}
    />
  )
}
function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
}
function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
}
function CardContent({ className, ...props }) {
  return (
    <div className={cn("p-6 pt-0", className)} {...props} />
  )
}

// Table Components
function Table({ className, ...props }) {
  return (
    <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
  )
}
function TableHeader({ className, ...props }) {
  return <thead className={cn("[&_tr]:border-b", className)} {...props} />
}
function TableBody({ className, ...props }) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
}
function TableRow({ className, ...props }) {
  return <tr className={cn("border-b transition-colors hover:bg-slate-50", className)} {...props} />
}
function TableHead({ className, ...props }) {
  return <th className={cn("h-12 px-4 text-left align-middle font-medium text-slate-600", className)} {...props} />
}
function TableCell({ className, ...props }) {
  return <td className={cn("p-4 align-middle", className)} {...props} />
}

// Badge Component
function Badge({ className, variant, ...props }) {
  const baseClasses = "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors";
  let variantClasses = "";
  switch (variant) {
    case "secondary": variantClasses = "bg-slate-100 text-slate-900"; break;
    case "destructive": variantClasses = "bg-red-500 text-white"; break;
    case "warning": variantClasses = "bg-amber-500 text-white"; break;
    case "highlight": variantClasses = "bg-purple-500 text-white"; break;
    case "outline": variantClasses = "border border-slate-200 text-slate-900"; break;
    default: variantClasses = "bg-slate-900 text-white";
  }
  return <div className={cn(baseClasses, variantClasses, className)} {...props} />
}

// Progress Component
const Progress = React.forwardRef(({ className, value, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("relative h-2 w-full overflow-hidden rounded-full bg-slate-200", className)}
        {...props}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
    >
        <div
            className={cn("h-full w-full flex-1 bg-blue-600 transition-all")}
            style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
    </div>
));
Progress.displayName = "Progress"


// Skeleton Component
function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200", className)}
      {...props}
    />
  )
}

// --- Chart Components ---

// Custom Tooltip for Bar Chart
const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-white border border-gray-300 rounded-lg shadow-lg">
        <p className="font-bold text-gray-800">{label}</p>
        <p className="text-sm text-blue-600">{`경쟁률: ${payload[0].value.toFixed(2)} : 1`}</p>
      </div>
    );
  }
  return null;
};

// 경쟁률 상위 학과 막대 차트
function CompetitionBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={500}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 200 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="displayName" 
          angle={-55}
          textAnchor="end" 
          interval={0}
          tick={{ fontSize: 12, fill: '#475569' }} 
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#475569' }} />
        <Tooltip
          cursor={{ fill: 'rgba(239, 246, 255, 0.7)' }}
          content={<CustomBarTooltip />}
        />
        <Legend verticalAlign="top" height={36} iconSize={14} wrapperStyle={{ fontSize: '14px' }} />
        <Bar dataKey="경쟁률" name="경쟁률" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// 계열별 지원자 분포 파이 차트
function CategoryPieChart({ data }) {
  const COLORS = ['#3b82f6', '#10b981', '#f97316', '#ef4444', '#8b5cf6', '#64748b'];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Hide label for small slices

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="font-semibold text-sm">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  
  return (
    <ResponsiveContainer width="100%" height={500}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={180}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
         <Tooltip 
          formatter={(value, name) => [`${value.toLocaleString()}명`, name]}
           contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '14px' }}/>
      </PieChart>
    </ResponsiveContainer>
  );
}


// --- Component Definition: EnrollmentTable (전형별 테이블) ---

function EnrollmentTable({ 전형명, data, isSpecial = false }) {
  const currentData = data.filter(row => !isSpecial || (row.전문대졸 !== undefined || row.북한이탈주민 !== undefined));
  
  const headerClasses = "bg-gradient-to-r from-slate-900 to-slate-700 text-white rounded-t-xl";
  const badgeClasses = "bg-white/20 text-white border-white/30";
  const categoryBadgeClasses = "bg-slate-100 text-slate-900 border-slate-300"; 

  const dataToRender = currentData;
  
  if (dataToRender.length === 0) {
    return null;
  }

  return (
    <Card className="border-0 shadow-lg rounded-xl">
      <CardHeader className={headerClasses}>
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
            {isSpecial ? <Users className="w-3 h-3" /> : <BarChart3 className="w-3 h-3" />}
          </div>
          <span>{전형명}</span>
          <Badge
            variant="secondary"
            className={cn("ml-auto", badgeClasses)}
          >
            {currentData.length}개 학과
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
                {!isSpecial && (
                  <>
                    <TableHead className="text-right">모집인원</TableHead>
                    <TableHead className="text-right">지원자수</TableHead>
                    <TableHead className="text-center">경쟁률</TableHead>
                    <TableHead>지원율</TableHead>
                  </>
                )}
                {isSpecial && (
                  <>
                    <TableHead className="text-right">전문대졸</TableHead>
                    <TableHead className="text-right">북한이탈주민</TableHead>
                    <TableHead className="text-right">총 지원자수</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataToRender.map((row, idx) => {
                const isGeneral = !isSpecial;
                const applicationRatePercent = isGeneral && row.모집인원 > 0
                    ? Math.round((row.지원자수 / row.모집인원) * 100)
                    : 0;
                const MAX_GAUGE_PERCENT = 2000;
                const progressValue = (applicationRatePercent / MAX_GAUGE_PERCENT) * 100;
                
                const specialTotal = (row.전문대졸 || 0) + (row.북한이탈주민 || 0);
                
                return (
                  <TableRow key={idx}>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", categoryBadgeClasses)}
                      >
                        {row.계열 || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-slate-900" title={row.학과}>
                      {row.학과}
                    </TableCell>
                    {isGeneral && (
                      <>
                        <TableCell className="text-right font-mono text-slate-700">
                          {row.모집인원?.toLocaleString() || '-'}명
                        </TableCell>
                        <TableCell className="text-right font-mono text-slate-700">
                          {row.지원자수?.toLocaleString() || '-'}명
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={getCompetitionBadgeColor(row.경쟁률)}
                            className="font-bold"
                          >
                            {row.경쟁률?.toFixed(1) || '0.0'}:1
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-600">
                              <span>지원율</span>
                              <span className="font-semibold">{applicationRatePercent.toLocaleString()}%</span>
                            </div>
                            <Progress value={progressValue} />
                          </div>
                        </TableCell>
                      </>
                    )}
                    {!isGeneral && (
                      <>
                        <TableCell className="text-right font-mono text-slate-700">
                          {row.전문대졸?.toLocaleString() || '0'}명
                        </TableCell>
                        <TableCell className="text-right font-mono text-slate-700">
                          {row.북한이탈주민?.toLocaleString() || '0'}명
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-slate-900">
                          {specialTotal?.toLocaleString() || '0'}명
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// --- 전년도 비교 테이블 ---
const ChangeIndicator = ({ value }) => {
    if (value === null || !isFinite(value) || value === 0) {
        return <span className="text-slate-500">-</span>;
    }

    const isIncrease = value > 0;
    const color = isIncrease ? "text-red-500" : "text-blue-500";
    const Icon = isIncrease ? ArrowUp : ArrowDown;

    return (
        <span className={cn("font-semibold flex items-center justify-center", color)}>
            <Icon className="w-3 h-3 mr-1" />
            {Math.abs(value).toFixed(1)}%
        </span>
    );
};

function ComparisonTable({ data }) {
    if (data.length === 0) {
        return (
             <Card className="border-0 shadow-lg">
                <CardContent className="pt-6 text-center text-slate-500">
                  <p>비교할 데이터가 없거나 필터링된 결과가 없습니다.</p>
                </CardContent>
              </Card>
        );
    }

    return (
        <Card className="border-0 shadow-lg rounded-xl">
            <CardHeader className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-3 text-xl">
                    <BarChart3 className="w-5 h-5" />
                    <span>전년도 경쟁률 비교</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead>계열</TableHead>
                                <TableHead>학과 (전형)</TableHead>
                                <TableHead className="text-center">구분</TableHead>
                                <TableHead className="text-right">모집인원</TableHead>
                                <TableHead className="text-right">지원인원</TableHead>
                                <TableHead className="text-right">경쟁률</TableHead>
                                <TableHead className="text-center">증감률</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((row, idx) => (
                                <React.Fragment key={idx}>
                                    <TableRow>
                                        <TableCell rowSpan={2} className="align-top py-2 border-b">
                                            <Badge variant="outline">{row.계열 || '-'}</Badge>
                                        </TableCell>
                                        <TableCell rowSpan={2} className="font-medium align-top py-2 border-b">
                                            {row.학과} ({row.전형명})
                                        </TableCell>
                                        <TableCell className="font-semibold text-slate-600 text-center">금년</TableCell>
                                        <TableCell className="text-right font-mono">{row.모집인원?.toLocaleString()}명</TableCell>
                                        <TableCell className="text-right font-mono">{row.지원자수?.toLocaleString()}명</TableCell>
                                        <TableCell className="text-right font-mono">{row.경쟁률?.toFixed(2)}:1</TableCell>
                                        <TableCell className="text-center">-</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-semibold text-slate-500 text-center">전년</TableCell>
                                        <TableCell className="text-right font-mono text-slate-500">{row.lastYear?.모집인원?.toLocaleString() ?? '-'}명</TableCell>
                                        <TableCell className="text-right font-mono text-slate-500">{row.lastYear?.지원자수?.toLocaleString() ?? '-'}명</TableCell>
                                        <TableCell className="text-right font-mono text-slate-500">{row.lastYear?.경쟁률?.toFixed(2) ?? '- '}:1</TableCell>
                                        <TableCell className="text-center">
                                            {row.changes ? (
                                                <div className="flex flex-col text-xs items-center">
                                                   <span><ChangeIndicator value={row.changes.지원자수} /> (지원)</span>
                                                   <span><ChangeIndicator value={row.changes.경쟁률} /> (경쟁)</span>
                                                </div>
                                            ) : '-'}
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}


// --- Main App ---

function getCompetitionBadgeColor(rate) {
  if (rate >= 50) return "destructive";
  if (rate >= 20) return "highlight";
  if (rate >= 10) return "warning";
  return "default";
}

export default function App() {
  const [data, setData] = useState([])
  const [lastYearData, setLastYearData] = useState([]);
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('전체');
  const [sortOrder, setSortOrder] = useState('none'); // 'none', 'desc', 'asc'
  const [activeTab, setActiveTab] = useState('current'); // 'current', 'lastYear'


  useEffect(() => {
    const currentYearPromise = fetch("http://localhost:8000/crawl")
      .then(res => res.ok ? res.json() : Promise.reject(`Current year data fetch failed: ${res.status}`))
      .then(res => res.data || []);

    const lastYearPromise = fetch("http://localhost:8000/crawl/lastyear")
      .then(res => res.ok ? res.json() : Promise.reject(`Last year data fetch failed: ${res.status}`))
      .then(res => res.data || []);

    Promise.all([currentYearPromise, lastYearPromise])
      .then(([currentData, lyData]) => {
        setData(currentData);
        setLastYearData(lyData);
      })
      .catch((err) => {
        console.error("데이터 불러오기 실패:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const comparisonData = useMemo(() => {
    if (!data || !lastYearData) return [];
    return data
      .filter(item => item.전형명 !== '특별전형')
      .map(currentItem => {
        const lastYearItem = lastYearData.find(item => {
          if (item.학과 !== currentItem.학과) return false;

          const normalize = (name = '') => name.replace(/전형|경쟁률 현황|\s/g, '').trim();
          
          let currentTypeName = normalize(currentItem.전형명);
          let lastYearTypeName = normalize(item.전형명);
          
          if ((currentTypeName === '일반' && lastYearTypeName === '일반고') || 
              (currentTypeName === '일반고' && lastYearTypeName === '일반')) return true;
          if (currentTypeName === '특성화고' && lastYearTypeName === '특성화고') return true;
          
          return currentTypeName === lastYearTypeName;
        });

        if (!lastYearItem) {
          return { ...currentItem, lastYear: null, changes: null };
        }

        const calcChange = (current, last) => {
            if (last === 0 || last === null || last === undefined) return current > 0 ? Infinity : 0;
            return ((current - last) / last) * 100;
        };
        
        const changes = {
            모집인원: calcChange(currentItem.모집인원, lastYearItem.모집인원),
            지원자수: calcChange(currentItem.지원자수, lastYearItem.지원자수),
            경쟁률: calcChange(currentItem.경쟁률, lastYearItem.경쟁률),
        };

        return { ...currentItem, lastYear: lastYearItem, changes };
      });
  }, [data, lastYearData]);
  
  const processedData = useMemo(() => {
    const sourceData = activeTab === 'current' ? data : comparisonData;
    
    let filtered = Array.isArray(sourceData) ? [...sourceData] : [];
  
    if (searchTerm) {
      filtered = filtered.filter(item => item.학과 && item.학과.toLowerCase().includes(searchTerm.toLowerCase()));
    }
  
    if (categoryFilter !== '전체') {
      filtered = filtered.filter(item => item.계열 === categoryFilter);
    }
  
    if (sortOrder !== 'none') {
        const getApplicants = (item) => (item.지원자수 || 0) + (item.전문대졸 || 0);
        filtered.sort((a, b) => sortOrder === 'desc' ? getApplicants(b) - getApplicants(a) : getApplicants(a) - getApplicants(b));
    }
  
    return filtered;
  }, [data, comparisonData, searchTerm, categoryFilter, sortOrder, activeTab]);

  const generalData = activeTab === 'current' 
    ? processedData.filter(item => item.전형명 !== "특별전형" && typeof item.경쟁률 === 'number')
    : processedData;
    
  const specialData = activeTab === 'current' 
    ? processedData.filter(item => item.전형명 === "특별전형")
    : [];
  
  const groupedGeneral = generalData.reduce((acc, cur) => {
    const category = cur.전형명 || '일반 전형';
    if (!acc[category]) acc[category] = []
    acc[category].push(cur)
    return acc
  }, {})

  const totalApplicants = data.reduce((sum, item) => sum + (item.지원자수 || 0) + (item.전문대졸 || 0) + (item.북한이탈주민 || 0), 0)
  const totalCapacity = data.reduce((sum, item) => sum + (item.모집인원 || 0), 0)
  
  const originalGeneralData = data.filter(item => item.전형명 !== "특별전형" && typeof item.경쟁률 === 'number');
  const competitionRates = originalGeneralData.map(item => item.경쟁률);
  const avgCompetitionRate = competitionRates.length > 0 ? competitionRates.reduce((sum, rate) => sum + rate, 0) / competitionRates.length : 0;
  
  const highestCompetitionRateItem = originalGeneralData.length > 0 
    ? originalGeneralData.reduce((max, item) => (item.경쟁률 > max.경쟁률 ? item : max), {경쟁률: 0, 학과: 'N/A'}) 
    : { 경쟁률: 0, 학과: 'N/A' };

  const topDepartments = useMemo(() => {
    const source = activeTab === 'current' ? processedData : comparisonData;
    let filteredSource = source.filter(item => item.전형명 !== '특별전형' && typeof item.경쟁률 === 'number');

     if (searchTerm) {
      filteredSource = filteredSource.filter(item => item.학과 && item.학과.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    return [...filteredSource]
        .sort((a,b) => b.경쟁률 - a.경쟁률)
        .slice(0,10)
        .map(item => ({...item, displayName: `${item.학과} (${item.전형명})`}));
  }, [processedData, comparisonData, activeTab, searchTerm]);


  const categoryDistribution = useMemo(() => {
    const source = activeTab === 'current' ? processedData : comparisonData;
    const applicantsByCategory = source.reduce((acc, cur) => {
      const category = cur.계열 || '기타';
      const applicants = (cur.지원자수 || 0) + (cur.전문대졸 || 0) + (cur.북한이탈주민 || 0);
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += applicants;
      return acc;
    }, {});
    
    return Object.keys(applicantsByCategory).map(key => ({
      name: key,
      value: applicantsByCategory[key]
    }));
  }, [processedData, comparisonData, activeTab]);

  const categories = ['전체', '공학', '예체능', '인문사회'];


  // 로딩 스켈레톤
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-7xl p-6 space-y-8">
        {/* 헤더 */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {searchTerm ? `${searchTerm} 경쟁률 현황` : '인하공업전문대학 수시 1차 경쟁률'}
              </h1>
              <p className="text-slate-600 mt-1">
                실시간 입학 경쟁률 및 지원 현황을 확인하세요
              </p>
            </div>
          </div>
        </div>
        
        {/* 탭 */}
        <div className="flex justify-center border-b border-slate-200">
            <button onClick={() => setActiveTab('current')} className={cn("px-6 py-3 font-semibold text-sm transition-colors", activeTab === 'current' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-blue-600')}>실시간 경쟁률</button>
            <button onClick={() => setActiveTab('lastYear')} className={cn("px-6 py-3 font-semibold text-sm transition-colors", activeTab === 'lastYear' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-blue-600')}>전년도 비교</button>
        </div>


        {/* 검색 및 필터링 */}
        <div className="space-y-4">
            <div className="relative">
                <input
                    type="text"
                    placeholder="학과명으로 검색... (예: 항공운항과)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 pl-10 text-base border-2 border-slate-200 rounded-xl shadow-inner focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
             <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-600 mr-2">계열 필터:</span>
                {categories.map(cat => (
                    <button 
                        key={cat} 
                        onClick={() => setCategoryFilter(cat)}
                        className={cn(
                            "px-3 py-1 text-sm font-medium rounded-full transition-colors",
                            categoryFilter === cat ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100'
                        )}
                    >
                        {cat}
                    </button>
                ))}
             </div>
        </div>

        {activeTab === 'current' && (
            <>
                {/* 통계 카드 */}
                <div className="grid gap-6 md:grid-cols-4">
                  <Card className="border-0 shadow-lg transition-all hover:shadow-xl bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-blue-700">총 지원자수 (전체)</CardTitle>
                      <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-extrabold text-blue-800">
                        {totalApplicants.toLocaleString()}명
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg transition-all hover:shadow-xl bg-gradient-to-br from-green-50 to-green-100">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-green-700">총 모집인원 (일반전형)</CardTitle>
                      <Target className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-extrabold text-green-800">
                        {totalCapacity.toLocaleString()}명
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg transition-all hover:shadow-xl bg-gradient-to-br from-orange-50 to-orange-100">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-orange-700">평균 경쟁률 (일반전형)</CardTitle>
                      <BarChart3 className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-extrabold text-orange-800">
                        {avgCompetitionRate.toFixed(2)}:1
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg transition-all hover:shadow-xl bg-gradient-to-br from-red-50 to-red-100">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-red-700">최고 경쟁률 (학과)</CardTitle>
                      <TrendingUp className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-red-800 truncate" title={highestCompetitionRateItem.학과}>
                        {highestCompetitionRateItem.경쟁률.toFixed(1)}:1
                      </div>
                      <p className="text-xs text-red-600 mt-1 font-semibold">{highestCompetitionRateItem.학과}</p>
                    </CardContent>
                  </Card>
                </div>
                
                 {/* 차트 섹션 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-xl text-slate-800">
                                <BarChart3 className="w-5 h-5 text-blue-600" />
                                <span>{searchTerm ? `${searchTerm} 경쟁률` : "경쟁률 TOP 10 학과"}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CompetitionBarChart data={topDepartments} />
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-xl text-slate-800">
                                <PieChartIcon className="w-5 h-5 text-blue-600" />
                                <span>계열별 지원자 분포</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CategoryPieChart data={categoryDistribution} />
                        </CardContent>
                    </Card>
                </div>
                 <div className="flex flex-wrap items-center gap-2 justify-end mt-8">
                     <span className="text-sm font-semibold text-slate-600 mr-2">정렬:</span>
                     <button 
                        onClick={() => setSortOrder('desc')}
                        className={cn("flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full transition-colors", sortOrder === 'desc' ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100')}>
                        <ArrowDownAZ className="w-4 h-4" /> 지원자수 높은 순
                    </button>
                    <button 
                        onClick={() => setSortOrder('asc')}
                        className={cn("flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full transition-colors", sortOrder === 'asc' ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100')}>
                       <ArrowUpAZ className="w-4 h-4" /> 지원자수 낮은 순
                    </button>
                     <button 
                        onClick={() => { setSortOrder('none');}}
                        className="flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full transition-colors bg-white text-slate-700 hover:bg-slate-100">
                       <FilterX className="w-4 h-4" /> 초기화
                    </button>
                </div>

                {/* 일반 전형별 테이블 */}
                {Object.keys(groupedGeneral).map((전형명) => (
                  <EnrollmentTable 
                    key={전형명} 
                    전형명={전형명} 
                    data={groupedGeneral[전형명]} 
                    isSpecial={false}
                  />
                ))}

                {/* 특별전형 섹션 (맨 아래 배치) */}
                {specialData.length > 0 && (
                  <EnrollmentTable
                    전형명="지원인원 현황 (전문대졸, 북한이탈주민)"
                    data={specialData}
                    isSpecial={true}
                  />
                )}
            </>
        )}
        
        {activeTab === 'lastYear' && (
             <>
                <div className="flex flex-wrap items-center gap-2 justify-end mt-8">
                     <span className="text-sm font-semibold text-slate-600 mr-2">정렬:</span>
                     <button 
                        onClick={() => setSortOrder('desc')}
                        className={cn("flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full transition-colors", sortOrder === 'desc' ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100')}>
                        <ArrowDownAZ className="w-4 h-4" /> 지원자수 높은 순
                    </button>
                    <button 
                        onClick={() => setSortOrder('asc')}
                        className={cn("flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full transition-colors", sortOrder === 'asc' ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100')}>
                       <ArrowUpAZ className="w-4 h-4" /> 지원자수 낮은 순
                    </button>
                     <button 
                        onClick={() => { setSortOrder('none');}}
                        className="flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full transition-colors bg-white text-slate-700 hover:bg-slate-100">
                       <FilterX className="w-4 h-4" /> 초기화
                    </button>
                </div>
                <ComparisonTable data={processedData} />
            </>
        )}


        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-sm text-slate-500">
            * 경쟁률 및 지원자 수는 실시간으로 업데이트되며, 최종 경쟁률과 다를 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  )
}

