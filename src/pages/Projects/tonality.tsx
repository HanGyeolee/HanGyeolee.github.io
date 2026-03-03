import React, { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { StaffNotation, Harmony, Scale } from "../../components/ui/StaffNotation.tsx";
import { TitleMap, useAutoDocumentTitle } from "../../components/util/language.ts";

const titles: TitleMap = {
  ko : '조성 검색',
  en : 'Search Tonality'
}

const Tonality = () => {
    const { detectedLanguage, appliedTitle } = useAutoDocumentTitle(titles);

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const key: string|null = decodeURIComponent(searchParams.get('key'));
    const scale:Scale = getScaleFromString(searchParams.get('scale'));
  
    const [mainHarmony, setMainHarmony] = useState<Harmony[]>([]);
    const [subHarmony, setSubHarmony] = useState<Harmony[]>([]);
    const [seventhHarmony, setSeventhHarmony] = useState<Harmony[]>([]);
    const [sseventhHarmony, setsSeventhHarmony] = useState<Harmony[]>([]);
    const [sixthHarmony, setSixthHarmony] = useState<Harmony[]>([]);

    // URL 파라미터가 바뀌면 화성 계산
    useEffect(() => {
      if (key) {
        setMainHarmony(calculateHarmony(key, scale));
        setSeventhHarmony(calculateSeventhHarmony(key, scale))
        setSixthHarmony(calculateSixthHarmony(key));
        if(scale === Scale.minor) {
          setSubHarmony(calculateHarmony(key, Scale.harmonic_minor));
          setsSeventhHarmony(calculateSeventhHarmony(key, Scale.harmonic_minor));
        }
      }
    }, [key, scale]);

    useEffect(() => {

    },[mainHarmony, subHarmony])

    const handleSearch = (e:React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // 입력에서 조표와 장/단조 추출하는 로직
        let { key, scale } = parseInput(e.target[0].value);

        // 설마 이거 까지 시도하는 사람이 있겠어???
        if(key === "G#") key = "Ab";
        else if(key === "D#") key = "Eb";
        else if(key === "A#") key = "Bb";
        else if(key === "E#") key = "F";
        else if(key === "Fb") key = "E";
        
        // 유효한 입력이면 해당 파라미터로 라우팅
        if (key && scale) {
            navigate(`?key=${key}&scale=${scale}`);
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
        
        // 한국어 음계 패턴
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
    function calculateHarmony(key: string, scale: Scale) {
        // 음계 정의 (반음 간격)
        const majorIntervals:number[] = [0, 2, 4, 5, 7, 9, 11];
        const naturalMinorIntervals:number[] = [0, 2, 3, 5, 7, 8, 10];       // 자연 단음계
        const harmonicMinorIntervals:number[] = [0, 2, 3, 5, 7, 8, 11];      // 하모닉 단음계
        
        // 조표에 따른 시작점 계산
        let rootIndex = getNoteIndex(key);
        
        // 장조/단조에 따른 간격 선택
        let intervals:number[];
        // 기능 화성 생성
        const harmony:Harmony[] = [];
        // 각 스케일에 따른 로마 숫자 표기
        let romanNumerals;

        switch (scale){
          case Scale.major:
            intervals = majorIntervals;
            romanNumerals = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii_°'];
            break;
          case Scale.minor:
            intervals = naturalMinorIntervals;
            romanNumerals = ['i', 'ii_°', 'III', 'iv', 'v', 'VI', 'VII'];
            break;
          case Scale.harmonic_minor:
            intervals = harmonicMinorIntervals;
            romanNumerals = ['i', 'ii_°', 'III_+', 'iv', 'V', 'VI', 'vii_°'];
            break;
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
                while(chordNotes[j-1]>chordNotes[j]){
                  chordNotes[j]+=12;
                }
            }
            
            harmony.push({
                roman: romanNumerals[i],
                notes: chordNotes
            });
        }
        
        return harmony;
    }

    function calculateSeventhHarmony(key: string, scale: Scale) {
      // 음계 정의 (반음 간격)
      const majorIntervals:number[] = [0, 2, 4, 5, 7, 9, 11];
      const naturalMinorIntervals:number[] = [0, 2, 3, 5, 7, 8, 10];       // 자연 단음계
      const harmonicMinorIntervals:number[] = [0, 2, 3, 5, 7, 8, 11];      // 하모닉 단음계
      
      // 조표에 따른 시작점 계산
      let rootIndex = getNoteIndex(key);
      
      // 장조/단조에 따른 간격 선택
      let intervals:number[];
      // 기능 화성 생성
      const harmony:Harmony[] = [];
      // 각 스케일에 따른 로마 숫자 표기
      let romanNumerals;

      switch (scale){
        case Scale.major:
          intervals = majorIntervals;
          romanNumerals = ['I_M7', 'ii_7', 'iii_7', 'IV_M7', 'V_7', 'vi_7', 'vii_ø7'];
          break;
        case Scale.minor:
          intervals = naturalMinorIntervals;
          romanNumerals = ['i_7', 'ii_ø7', 'III_M7', 'iv_7', 'v_7', 'VI_M7', 'VII_7'];
          break;
        case Scale.harmonic_minor:
          intervals = harmonicMinorIntervals;
          romanNumerals = ['i_mM7', 'ii_ø7', 'III_+M7', 'iv_7', 'V_7', 'VI_M7', 'vii_°7'];
          break;
      }
      
      for (let i = 0; i < 7; i++) {
          // 3도 간격으로 화음 구성
          const chordNotes = [
              rootIndex + intervals[i],
              rootIndex + intervals[(i + 2) % 7],
              rootIndex + intervals[(i + 4) % 7],
              rootIndex + intervals[(i + 6) % 7],
          ];

          // 근음보다 항상 위에 존재.
          for(let j = 1; j < chordNotes.length; j++) {
              while(chordNotes[j-1]>chordNotes[j]){
                chordNotes[j]+=12;
              }
          }

          let roman = romanNumerals[i]
          
          harmony.push({
            roman,
            notes: chordNotes,
          });
      }
      
      return harmony;
    }

    function calculateSixthHarmony(key: string) {
      // 조표에 따른 시작점 계산
      let rootIndex = getNoteIndex(key);
      // 기능 화성 생성
      const harmony:Harmony[] = [];

      const chordNotes:Record<string,number[]> = {
        'It_+6':[rootIndex - 4 + 12, rootIndex + 0 + 12, rootIndex + 6 + 12],
        'Fr_+6':[rootIndex - 4 + 12, rootIndex + 0 + 12, rootIndex + 2 + 12, rootIndex + 6 + 12],
        'Ger_+6':[rootIndex - 4 + 12, rootIndex + 0 + 12, rootIndex + 3 + 12, rootIndex + 6 + 12],
      };

      let optionNotes:Record<string,string[]>;
      switch (scale){
        case Scale.major:
          optionNotes = {
            'It_+6':['b6','1','#4'],
            'Fr_+6':['b6','1','2','#4'],
            'Ger_+6':['b6','1','b3','#4'],
          };
          break;
        case Scale.minor:
        case Scale.harmonic_minor:
          optionNotes = {
            'It_+6':['6','1','#4'],
            'Fr_+6':['6','1','2','#4'],
            'Ger_+6':['6','1','3','#4'],
          };
          break;
      }

      console.log(chordNotes)
      for(const roman in chordNotes){
        harmony.push({
            roman,
            notes: chordNotes[roman],
            option: optionNotes[roman]
        });
      }
      
      return harmony;
    }

    function initValue(){
        if (key && key != null && key !== 'null'){
            return `${key} ${getStringFromScale(scale)}`;
        }
        return undefined;
    }

    return (
        <div className="container mx-auto p-4">
          <div className="mb-6">
            <form className="flex items-center mb-4 justify-between" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="예: Bb major, F# minor, G 장조, 내림라 단조"
                defaultValue={initValue()}
                className="px-4 py-2 border rounded-md w-[50%] mr-2"
              />
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-500 w-auto text-white rounded-md"
              >
                검색
              </button>
            </form>
          </div>
          
          {key && key != null && key !== 'null' ? (
            <div className="bg-white p-4 rounded-lg shadow-md">

              {/* 오선 및 기능 화성 표시 */}
              <h2 key={"main"} className="text-xl font-bold mb-4">
                {key} {scale === Scale.major ? 'Major' : 'Minor'} 
              </h2>
              <div key={"main-div"} className="overflow-x-auto">
                <StaffNotation 
                  harmony={mainHarmony} 
                  keySignature={key} 
                  scale={scale} 
                />
              </div>

              {/* 하모닉 마이너 표시 */}
              {scale === Scale.minor ? [
                <h2 key={"harmonic minor"} className="text-xl font-bold mb-4">
                  {key} Harmonic Minor
                </h2>,
                <div key={"harmonic minor-div"} className="overflow-x-auto">
                  <StaffNotation 
                    harmony={subHarmony} 
                    keySignature={key} 
                    scale={Scale.harmonic_minor} 
                  />
                </div>
              ] : (null)}

              {/* 7 화성 표시 */}
              <h2 key={"main7"} className="text-xl font-bold mb-4">
                Seventh Chords of {key} {scale === Scale.major ? 'Major' : 'Minor'} 
              </h2>
              <div key={"main7-div"} className="overflow-x-auto">
                <StaffNotation 
                  harmony={seventhHarmony} 
                  keySignature={key} 
                  scale={scale} 
                />
              </div>

              {/* 하모닉 마이너의 7 화성 표시 */}
              {scale === Scale.minor ? [
                <h2 key={"harmonic minor7"} className="text-xl font-bold mb-4">
                  Seventh Chords of {key} Harmonic Minor 
                </h2>,
                <div key={"harmonic minor7-div"} className="overflow-x-auto">
                  <StaffNotation 
                    harmony={sseventhHarmony} 
                    keySignature={key} 
                    scale={Scale.harmonic_minor} 
                  />
                </div>
              ] : (null)}

              {/* 감 6 화성 표시 */}
              <h2 key={"aug six"} className="text-xl font-bold mb-4">
                Augmented Sixth Chords
              </h2>
              <div key={"aug six-div"} className="overflow-x-auto">
                <StaffNotation 
                  harmony={sixthHarmony} 
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

function getScaleFromString(scaleString: string | null): Scale {
  if (scaleString === 'major') {
    return Scale.major;
  } else if (scaleString === 'minor') {
    return Scale.minor;
  } else if (scaleString === 'harmonic_minor') {
    return Scale.harmonic_minor;
  }
  
  // 기본값 설정 (예: major)
  return Scale.major;
}
function getStringFromScale(scale:Scale):string{
  switch(scale){
    case Scale.minor:
      return 'minor';
    default:
      return 'major';
  }
}

export default Tonality;