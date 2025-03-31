import React, { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { StaffNotation } from "../../components/ui";
import { Harmony } from "../../components/ui/StaffNotation";

const Tonality = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const key = decodeURIComponent(searchParams.get('key')); // 'react'
    const scale = searchParams.get('scale'); // 'react'
  
    const [harmony, setHarmony] = useState<Harmony[]>([]);

    // URL 파라미터가 바뀌면 화성 계산
    useEffect(() => {
        if (key && scale) {
            const calculatedHarmony = calculateHarmony(key, scale);
            setHarmony(calculatedHarmony);
        }
    }, [key, scale]);

    useEffect(() => {

    },[harmony])

    const handleSearch = (e:React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // 입력에서 조표와 장/단조 추출하는 로직
        const { key, scale } = parseInput(e.target[0].value);
        
        // 유효한 입력이면 해당 파라미터로 라우팅
        if (key && scale) {
            navigate(`/tonality?key=${key}&scale=${scale}`);
        }
    };

    // 입력을 파싱하는 함수
    const parseInput = (input: string) => {
        // 한국어 음계 매핑
        const koreanNotes: Record<string, string> = {
          '가': 'A', '나': 'B', '다': 'C', '라': 'D', 
          '마': 'E', '바': 'F', '사': 'G', 
        };

        // 영어 음계 패턴
        const englishNotePattern = /([A-G][b#]?)/i;
        
        // 한국어 음계 패턴 (올림/내림 포함)
        const koreanNotePattern = /(?:(올림|내림)\s*)?([가나다라마바사])/i;
        
        // 영어 조성 패턴
        const englishScalePattern = /(major|minor|maj|min|M|m)/i;
        
        // 한국어 조성 패턴
        const koreanScalePattern = /(장조|단조)/i;
        
        let key:string|undefined = undefined;
        let scale:string|undefined = undefined;
  
        // 영어 음계 찾기
        const englishNoteMatch = input.match(englishNotePattern);
        if (englishNoteMatch) {
          key = englishNoteMatch[1];
        }
        
        // 한국어 음계 찾기
        const koreanNoteMatch = input.match(koreanNotePattern);
        if (koreanNoteMatch && !key) {
          const accidental = koreanNoteMatch[1] || '';
          const note = koreanNoteMatch[2];
          
          // 음계 변환
          key = koreanNotes[note];
          
          // 변화표 적용
          if (accidental) {
            if (accidental === '올림') {
              key += '#';
            } else if (accidental === '내림') {
              key += 'b';
            }
          }
        }

        if(key){
            key = encodeURIComponent(key);
        }

        // 영어 패턴 먼저 시도
        const englishScaleMatch = input.match(englishScalePattern);
        if (englishScaleMatch) {
          if(englishScaleMatch[1].length > 1){
            scale = englishScaleMatch[1].toLowerCase().startsWith('mi') ? 'minor' : 'major';
          } else {
            scale = englishScaleMatch[1] === "m" ? 'minor' : 'major';
          }
        }
        
        // 한국어 조성 찾기
        const koreanScaleMatch = input.match(koreanScalePattern);
        if (koreanScaleMatch && !scale) {
            scale = koreanScaleMatch[1] === '장조' ? 'major' : 'minor';
        }
        
        return { key: key, scale: scale };
    };

    // 시작점 찾기
    function getNoteIndex(note: string): number {
        const baseNotes: Record<string, number> = {
           'A': 57, 'B': 59, 'C': 60, 'D': 62, 'E': 64, 'F': 65, 'G': 67
        };
      
        let index = baseNotes[note.charAt(0)];
        
        // 변화표 처리
        if (note.includes('#')) {
            index += 1;
        } else if (note.includes('b')) {
            index -= 1;
        }
        
        return index;
    }

    // 기능 화성 계산 함수
    function calculateHarmony(key: string, scale: string, harmonic: boolean = false) {
        // 음계 정의 (반음 간격)
        const majorIntervals:number[] = [0, 2, 4, 5, 7, 9, 11];
        const naturalMinorIntervals:number[] = [0, 2, 3, 5, 7, 8, 10];       // 자연 단음계
        const harmonicMinorIntervals:number[] = [0, 2, 3, 5, 7, 8, 11];      // 하모닉 단음계
        
        // 조표에 따른 시작점 계산
        let rootIndex = getNoteIndex(key);
        
        // 장조/단조에 따른 간격 선택
        let intervals:number[];
        if (scale === 'major') {
            intervals = majorIntervals;
        } else { // 기본 minor
            if(harmonic){
                intervals = harmonicMinorIntervals;
            }
            else{
                intervals = naturalMinorIntervals;
            }
        }
        
        // 기능 화성 생성
        const harmony:Harmony[] = [];
        // 각 스케일에 따른 로마 숫자 표기
        let romanNumerals;
        
        if (scale === 'major') {
            romanNumerals = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
        } else {
            if(harmonic){
                // 하모닉 마이너의 화성 표기: 5도와 7도 화음의 특성이 변함
                romanNumerals = ['i', 'ii°', 'III+', 'iv', 'V', 'VI', 'vii°'];
            }
            else{
                romanNumerals = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];
            }
        }
        
        for (let i = 0; i < 7; i++) {
            // 3도 간격으로 화음 구성
            const chordNotes = [
                rootIndex + intervals[i],
                rootIndex + intervals[(i + 2) % 7],
                rootIndex + intervals[(i + 4) % 7],
            ];

            // 근음보다 항상 위에 존재.
            for(let j = 1; j < 3; j++) {
                while(chordNotes[j-1]>chordNotes[j])
                    chordNotes[j]+=12;
            }
            
            harmony.push({
                roman: romanNumerals[i],
                notes: chordNotes,
                degree: i + 1 // 음계 내 도수
            });
        }
        
        return harmony;
    }

    function initValue(){
        if (key && scale){
            return `${key} ${scale}`;
        }
        return undefined;
    }

    return (
        <div className="container mx-auto p-4">
          <div className="mb-6">
            <form className="flex items-center mb-4" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="예: C major, F# minor, G 장조, 라 단조"
                defaultValue={initValue()}
                className="px-4 py-2 border rounded-md w-full mr-2"
              />
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md"
              >
                검색
              </button>
            </form>
          </div>
          
          {key && scale ? (
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4">
                {key} {scale === 'major' ? 'Major' : 'Minor'} 
              </h2>
              
              {/* 오선 및 기능 화성 표시 */}
              <div className="overflow-x-auto">
                <StaffNotation 
                  harmony={harmony} 
                  keySignature={key} 
                  scale={scale} 
                />
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 p-8 rounded-lg text-center">
              <p>조성을 입력하면 기능 화성이 표시됩니다.</p>
            </div>
          )}
        </div>
      );
}

export {Tonality};