import React, { ReactNode, useEffect, useRef, useState } from "react";

enum Scale {
  major,
  minor,
  harmonic_minor
}
enum KeySignType{
  nature,
  sharp,
  flat
}
interface Harmony {
    roman: string; 
    notes: number[];
    option?: string[];
}
interface NotationProps {
  harmony: Harmony[];
  keySignature: string;
  scale: Scale;
}

const StaffNotation: React.FC<NotationProps> = ({ harmony, keySignature, scale }) => {
  // SVG 크기 및 여백 설정
  const svgHeight = 200;
  const margin = { top: 20, right: 25, bottom: 20, left: 25 };
  
  // 오선 간격 및 위치 계산
  const staffLineSpacing = 12; // 오선 간격
  const staffYPosition = margin.top + 50; // 오선 시작 Y 위치
  
  // 조표 및 음자리표 위치
  const clefX = margin.left + 5;
  const keySignatureX = clefX + 34;

  const svgRef = useRef<SVGSVGElement>(null);
  const [svgWidth, setSvgWidth] = useState<number>(900); // 기본값으로 시작
  const [chordWidth, setChordWidth] = useState<number>((900 - margin.left - margin.right) / (harmony.length + 1)); // 기본값으로 시작
  const [initialized, setInitialized] = useState<boolean>(false);

  // SVG 크기 업데이트 감지 및 적용
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const newWidth = svgRef.current.getBoundingClientRect().width;
        if (newWidth > 0 && (Math.abs(newWidth - svgWidth) > 0.1 || !initialized)) {
          setSvgWidth(newWidth);
          setChordWidth((newWidth - margin.left - margin.right) / (harmony.length + 1));
          setInitialized(true);
        }
      }
    };

    // 초기 로드 시 크기 업데이트
    updateDimensions();

    // 창 크기 변경 시 업데이트
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [svgWidth, chordWidth, initialized]);

  // SVG 크기 업데이트 감지 및 적용
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const newWidth = svgRef.current.getBoundingClientRect().width;
        setSvgWidth(newWidth);
        setChordWidth((newWidth - margin.left - margin.right) / (harmony.length + 1));
      }
    };

    // 초기 로드 시 크기 업데이트
    updateDimensions();

    // 창 크기 변경 시 업데이트
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [harmony]);
  
  // 화성 데이터가 없으면 기본 오선만 보여줌
  if (!harmony || harmony.length === 0) {
    return (
      <svg ref={svgRef} width="100%" height={svgHeight}>
        {/* 오선 5줄 그리기 */}
        {[0, 1, 2, 3, 4].map((line) => (
          <line
            key={`staff-line-${line}`}
            x1={margin.left}
            y1={staffYPosition + line * staffLineSpacing}
            x2={svgWidth - margin.right}
            y2={staffYPosition + line * staffLineSpacing}
            stroke="black"
            strokeWidth={1}
          />
        ))}
        
        {/* 음자리표 (임시로 G 음자리표를 텍스트로 표시) */}
        <text x={clefX} y={staffYPosition + 4 * staffLineSpacing} fontSize="64">𝄞</text>
        
        <text 
          x={svgWidth / 2} 
          y={staffYPosition - 20} 
          textAnchor="middle"
          fontSize="16"
        >
          음계를 선택하면 기능 화성이 표시됩니다
        </text>
      </svg>
    );
  }

  // 가로줄 추가 로직 수정
  const renderLedgerLines = (noteY: number, chordX: number) => {
    const ledgerLines: ReactNode[] = [];
    
    // 오선 위쪽으로 벗어난 음표의 가로줄
    if (noteY < staffYPosition) {
      const linesNeeded = Math.ceil((staffYPosition - noteY) / staffLineSpacing);
      
      for (let i = 1; i <= linesNeeded; i++) {
        const lineY = staffYPosition - i * staffLineSpacing;
        if (noteY <= lineY && lineY < staffYPosition) {
          ledgerLines.push(
            <line
              key={`ledger-top-${i}`}
              x1={chordX - 12}
              y1={lineY}
              x2={chordX + 12}
              y2={lineY}
              stroke="black"
              strokeWidth={1}
            />
          );
        }
      }
    }
    
    // 오선 아래쪽으로 벗어난 음표의 가로줄
    if (noteY > staffYPosition + 4 * staffLineSpacing) {
      const linesNeeded = Math.ceil((noteY - (staffYPosition + 4 * staffLineSpacing)) / staffLineSpacing);
      
      for (let i = 1; i <= linesNeeded; i++) {
        const lineY = staffYPosition + 4 * staffLineSpacing + i * staffLineSpacing;
        if (noteY >= lineY && lineY > staffYPosition + 4 * staffLineSpacing) {
          ledgerLines.push(
            <line
              key={`ledger-bottom-${i}`}
              x1={chordX - 12}
              y1={lineY}
              x2={chordX + 12}
              y2={lineY}
              stroke="black"
              strokeWidth={1}
            />
          );
        }
      }
    }
    
    return ledgerLines;
  };
  
  // 조표 그리기용 함수
  const renderKeySignature = (keySignature:string) => {
    let sharpKeys:string[];
    let flatKeys:string[];
    if(scale === Scale.major){
      sharpKeys = ['G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
      flatKeys = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
    } else {
      sharpKeys = ['E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#'];
      flatKeys = ['D', 'G', 'C', 'F', 'Bb', 'Eb', 'Ab'];
    }
    
    // const baseKey = keySignature.charAt(0);
    const isSharp = keySignature.includes('#') || sharpKeys.find(k => k === keySignature);
    const isFlat = keySignature.includes('b') || flatKeys.find(k => k === keySignature);
    
    let accidentalCount = 0;
    let CMAm_key = (keySignature !== 'C' && scale !== Scale.major) ||
      (keySignature !== 'A' && scale === Scale.major);
    
    if (isSharp) {
      accidentalCount = sharpKeys.findIndex(k => k === keySignature) + 1;
      if (accidentalCount === 0 && CMAm_key) {
        // 커스텀 샵 조표 처리
        accidentalCount = 1;
      }
    } else if (isFlat) {
      accidentalCount = flatKeys.findIndex(k => k === keySignature) + 1;
      if (accidentalCount === 0 && CMAm_key) {
        // 커스텀 플랫 조표 처리
        accidentalCount = 1;
      }
    }
    
    // 샵/플랫 위치 (G Clef 기준)
    const sharpPositions = [
      { line: 1, offset: 0 },   // F#
      { line: 4, offset: 0 },   // C#
      { line: 0, offset: 0 },   // G#
      { line: 3, offset: 0 },   // D#
      { line: 6, offset: 0 },   // A#
      { line: 2, offset: 0 },   // E#
      { line: 5, offset: 0 }    // B#
    ];
    
    const flatPositions = [
      { line: 5, offset: 0 },   // Bb
      { line: 2, offset: 0 },   // Eb
      { line: 6, offset: 0 },   // Ab
      { line: 3, offset: 0 },   // Db
      { line: 7, offset: 0 },   // Gb
      { line: 4, offset: 0 },   // Cb
      { line: 8, offset: 0 }    // Fb
    ];
    
    const accidentals:React.ReactElement[] = [];
    
    for (let i = 0; i < accidentalCount; i++) {
      const x = keySignatureX + i * 10;
      let y;
      
      if (isSharp) {
        const pos = sharpPositions[i];
        y = staffYPosition + (pos.line * staffLineSpacing / 2) + pos.offset + 3;
        
        accidentals.push(
          <text key={`sharp-${i}`} x={x} y={y} 
          fontSize="24" 
          fontFamily="serif"
          fontWeight={600}>♯</text>
        );
      } else if (isFlat) {
        const pos = flatPositions[i];
        y = staffYPosition + (pos.line * staffLineSpacing / 2) + pos.offset - 1;
        
        accidentals.push(
          <text key={`flat-${i}`} x={x} y={y} 
          fontSize="24" 
          fontFamily="serif"
          fontWeight={600}>♭</text>
        );
      }
    }
    return accidentals;
  };

  // 음표 렌더링 부분에서 임시표 추가하기
  const renderNote = (midiNotes: number[], index:number, chordX: number, keySignature: string, scale:Scale, option?:string[]) => {
    const diatonicNotes = midiToDiatonic(midiNotes, keySignature, scale, option);
    const notePos:number[][] = [];

    let minPos = chordX;
    for(let i = 0; i < diatonicNotes.length; i++) {
      const notes = diatonicNotes[i];
      // 다이어토닉 노트 위치 계산 (C, D, E, F, G, A, B)
      const diatonicIndex = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].indexOf(notes.letter);
      // G4 = 67 (MIDI 노트 번호)를 기준으로 계산
      const G4Position = staffYPosition + 3 * staffLineSpacing;
      // 옥타브 차이 계산 (한 옥타브당 3.5줄 차이)
      const octaveDiff = (notes.octave - 4) * 7 * (staffLineSpacing / 2);
      // 다이아토닉 노트 위치 차이 계산
      // G(4)부터 시작해서 C(0), D(1)... 순서로 오선 위로 올라감
      const noteDiff = (diatonicIndex - 4) * (staffLineSpacing / 2);
      const noteY =  G4Position - octaveDiff - noteDiff;

      notePos.push([chordX, noteY]);

      if(i > 0) {
        const diff = notePos[i-1][1] - noteY;
        if(diff < staffLineSpacing * 3 / 4) {
          let thisNoteInLine = false;
          for(let j = 0; j < 5; j++) {
            let lineY = staffYPosition + j * staffLineSpacing;
            if(lineY - Number.EPSILON < noteY && noteY < lineY + Number.EPSILON){
              thisNoteInLine = true;
              break;
            }
          }
          if(thisNoteInLine){
            notePos[i][0] -= 16;
            if(notePos[i][0] < minPos)
              minPos = notePos[i][0];
          }else{
            notePos[i-1][0] -= 16
            if(notePos[i-1][0] < minPos)
              minPos = notePos[i-1][0];
          }
        }
      }
    }

    return (
      diatonicNotes.map((notes, noteIdx) => {
        const noteX =  notePos[noteIdx][0];
        const noteY =  notePos[noteIdx][1];
        const subX = minPos == chordX ? noteX: noteX - 12;

        return <g key={`note-${index}-${noteIdx}`}>
          {/* 필요한 경우 가로줄 추가 */}
          {renderLedgerLines(noteY, noteX)}
          
          {/* 음표 (원으로 표시) */}
          <ellipse
            cx={noteX}
            cy={noteY}
            rx={8}
            ry={6}
            transform={`rotate(-20, ${noteX}, ${noteY})`}
            fill="black"
          />
          
          {/* 임시표 표시 - 조표에 없는 임시표만 표시 */}
          {renderAccidental(notes, subX, noteY, keySignature, scale)}
        </g>
      })
    );
  };
  
  // 임시표 렌더링 함수
  const renderAccidental = (note: DiatonicNote, x: number, y: number, keySignature: string, scale:Scale) => {
    // 조표 정보 가져오기
    const keyInfo = getKeySignatureInfo(keySignature, scale);
    
    // 조표에 포함된 변형인지 확인
    const keyAlteration = keyInfo.alterations[note.letter] || '';
    
    // 노트의 변형이 조표와 다를 때만 임시표 표시
    if (note.accidental !== keyAlteration) {
      const accidentalX = x - 32;
      const accidentalSymbol = getAccidentalSymbol(note.accidental);
      
      let deltaY = 9;

      if(note.accidental.includes('b')){
        deltaY = 5;
      }

      return (
        <text
          x={accidentalX}
          y={y + deltaY}
          fontSize="24"
          fontFamily="serif"
          fontWeight={600}
        >
          {accidentalSymbol}
        </text>
      );
    }
    
    return null;
  };
  
  // 변형 기호 반환 함수
  const getAccidentalSymbol = (accidental: string): string => {
    switch (accidental) {
      case '#': return '♯';
      case 'b': return '♭';
      case '##': return '𝄪';
      case 'bb': return '𝄫';
      default: return '♮';  // 나튜럴(변형 취소)
    }
  };
  
  return (
    <svg ref={svgRef} width="100%" height={svgHeight}>
      {/* 오선 5줄 그리기 */}
      {[0, 1, 2, 3, 4].map((line) => (
        <line
          key={`staff-line-${line}`}
          x1={margin.left}
          y1={staffYPosition + line * staffLineSpacing}
          x2={svgWidth - margin.right}
          y2={staffYPosition + line * staffLineSpacing}
          stroke="black"
          strokeWidth={1}
        />
      ))}
      
      {/* 음자리표 (G 음자리표) */}
      <text x={clefX} y={staffYPosition + 4 * staffLineSpacing} fontSize="60">𝄞</text>
      
      {/* 조표 그리기 */}
      {renderKeySignature(keySignature)}
      
      {/* 화음 및 음표 그리기 */}
      {harmony.map((chord, index) => {
        const chordX = margin.left + keySignatureX + 90 + index * chordWidth;
        
        return (
          <g key={`chord-${index}`}>
            {/* 화음 로마 숫자 표기 */}
            <text
              x={chordX}
              y={staffYPosition - 40}
              textAnchor="middle"
              fontSize="20"
              fontWeight="bold"
            >
              {renderSuperscriptText(chord.roman)}
            </text>
            
            {/* 화음 구성음 그리기 */}
            {renderNote(chord.notes, index, chordX, keySignature, scale, chord.option)}
          </g>
        );
      })
    }
    </svg>
  );
};

const renderSuperscriptText = (text:string) => {
  if(text.includes('_')){
    const texts = text.split('_');
    return (
      <>
        {texts[0]}
        <tspan
          baselineShift="super"
          fontSize="0.7em"
        >
          {texts[1]}
        </tspan>
      </>
    );
  }
  
  // '°' 또는 '+' 문자를 찾아 분리
  const regex = /^([IiVv]+|[A-Za-z]+?)([+°øomM\d][^\s]*$)/;
  const matches = text.match(regex);
  
  if (!matches) {
    return text; // 특수 문자가 없으면 원래 텍스트 반환
  }
  
  const [_, beforeText, afterText] = matches;
  
  return (
    <>
      {beforeText}
      <tspan
        baselineShift="super"
        fontSize="0.7em"
      >
        {afterText}
      </tspan>
    </>
  );
};

// 모든 가능한 조표 유형과 해당 음계의 변형을 정의
interface KeySignatureInfo {
  key: string;         // 조표 (예: 'C', 'F#', 'Bb')
  type: KeySignType;
  alterations: {       // 변형된 음계 정보
    [note: string]: string; // 음이름: 변형(#, b, ##, bb)
  };
}

// 다이어토닉 노트 정보
interface DiatonicNote {
  letter: string;      // 음 이름 (A-G)
  accidental: string;  // 변형 ('', '#', 'b', '##', 'bb')
  octave: number;      // 옥타브
}

// MIDI 번호를 다이어토닉 노트로 변환하는 함수
const midiToDiatonic = (midiNotes: number[], keySignature: string, scale:Scale, option?:string[]): DiatonicNote[] => {  
  // 조표 분석하여 각 음의 변형 정보 가져오기
  const keyInfo = getKeySignatureInfo(keySignature, scale);
  
  // 다이어토닉 스케일의 음 결정
  return determineDiatonicNote(midiNotes, keyInfo, option);
};

// 조표 정보를 분석하는 함수
const getKeySignatureInfo = (keySignature: string, scale:Scale): KeySignatureInfo => {
  // 모든 가능한 키에 대한 변형 정보
  const keySignatures: { [key_scale: string]: KeySignatureInfo } = {
    // 자연 조성
    'C': { key: 'C', type:KeySignType.nature, alterations: {} },
    
    // 샵 조성들
    'G': { key: 'G', type:KeySignType.sharp, alterations: { 'F': '#' } },
    'D': { key: 'D', type:KeySignType.sharp, alterations: { 'F': '#', 'C': '#' } },
    'A': { key: 'A', type:KeySignType.sharp, alterations: { 'F': '#', 'C': '#', 'G': '#' } },
    'E': { key: 'E', type:KeySignType.sharp, alterations: { 'F': '#', 'C': '#', 'G': '#', 'D': '#' } },
    'B': { key: 'B', type:KeySignType.sharp, alterations: { 'F': '#', 'C': '#', 'G': '#', 'D': '#', 'A': '#' } },
    'F#': { key: 'F#', type:KeySignType.sharp, alterations: { 'F': '#', 'C': '#', 'G': '#', 'D': '#', 'A': '#', 'E': '#' } },
    'C#': { key: 'C#', type:KeySignType.sharp, alterations: { 'F': '#', 'C': '#', 'G': '#', 'D': '#', 'A': '#', 'E': '#', 'B': '#' } },
    
    // 플랫 조성들
    'F': { key: 'F', type:KeySignType.flat, alterations: { 'B': 'b' } },
    'Bb': { key: 'Bb', type:KeySignType.flat, alterations: { 'B': 'b', 'E': 'b' } },
    'Eb': { key: 'Eb', type:KeySignType.flat, alterations: { 'B': 'b', 'E': 'b', 'A': 'b' } },
    'Ab': { key: 'Ab', type:KeySignType.flat, alterations: { 'B': 'b', 'E': 'b', 'A': 'b', 'D': 'b' } },
    'Db': { key: 'Db', type:KeySignType.flat, alterations: { 'B': 'b', 'E': 'b', 'A': 'b', 'D': 'b', 'G': 'b' } },
    'Gb': { key: 'Gb', type:KeySignType.flat, alterations: { 'B': 'b', 'E': 'b', 'A': 'b', 'D': 'b', 'G': 'b', 'C': 'b' } },
    'Cb': { key: 'Cb', type:KeySignType.flat, alterations: { 'B': 'b', 'E': 'b', 'A': 'b', 'D': 'b', 'G': 'b', 'C': 'b', 'F': 'b' } },

    // 자연 조성
    'Am': { key: 'Am', type:KeySignType.nature, alterations: {} },
    
    // 샵 조성들
    'Em': { key: 'Em', type:KeySignType.sharp, alterations: { 'F': '#' } },
    'Bm': { key: 'Bm', type:KeySignType.sharp, alterations: { 'F': '#', 'C': '#' } },
    'F#m': { key: 'F#m', type:KeySignType.sharp, alterations: { 'F': '#', 'C': '#', 'G': '#' } },
    'C#m': { key: 'C#m', type:KeySignType.sharp, alterations: { 'F': '#', 'C': '#', 'G': '#', 'D': '#' } },
    'G#m': { key: 'G#m', type:KeySignType.sharp, alterations: { 'F': '#', 'C': '#', 'G': '#', 'D': '#', 'A': '#' } },
    'D#m': { key: 'D#m', type:KeySignType.sharp, alterations: { 'F': '#', 'C': '#', 'G': '#', 'D': '#', 'A': '#', 'E': '#' } },
    'A#m': { key: 'A#m', type:KeySignType.sharp, alterations: { 'F': '#', 'C': '#', 'G': '#', 'D': '#', 'A': '#', 'E': '#', 'B': '#' } },
    
    // 플랫 조성들
    'Dm' : { key: 'Dm',     type:KeySignType.flat, alterations: { 'B': 'b' } },
    'Gm' : { key: 'Gm',     type:KeySignType.flat, alterations: { 'B': 'b', 'E': 'b' } },
    'Cm' : { key: 'Cm',     type:KeySignType.flat, alterations: { 'B': 'b', 'E': 'b', 'A': 'b' } },
    'Fm' : { key: 'Fm',     type:KeySignType.flat, alterations: { 'B': 'b', 'E': 'b', 'A': 'b', 'D': 'b' } },
    'Bbm': { key: 'Bbm',  type:KeySignType.flat, alterations: { 'B': 'b', 'E': 'b', 'A': 'b', 'D': 'b', 'G': 'b' } },
    'Ebm': { key: 'Ebm',  type:KeySignType.flat, alterations: { 'B': 'b', 'E': 'b', 'A': 'b', 'D': 'b', 'G': 'b', 'C': 'b' } },
    'Abm': { key: 'Abm',  type:KeySignType.flat, alterations: { 'B': 'b', 'E': 'b', 'A': 'b', 'D': 'b', 'G': 'b', 'C': 'b', 'F': 'b' } },
  };

  let name = keySignature + (scale === Scale.major ? '' : 'm');
  
  // 주어진 조표가 기존 정의에 없는 경우, 가장 가까운 조표 정보를 사용
  if (!keySignatures[name]) {
    console.warn(`Unknown key signature: ${name}. Using C major/A minor.`);
    return keySignatures['C'];
  }
  
  return keySignatures[name];
};

// 주어진 피치 클래스와 조표 정보를 바탕으로 다이어토닉 노트 결정
const determineDiatonicNote = (midiNotes: number[], keyInfo: KeySignatureInfo, option?: string[]): DiatonicNote[] => {
  const chromaticPitchClasses: Record<string, number> = {
    'B#': 0, 'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 
    'E': 4, 'Fb': 4, 'E#': 5, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 
    'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11, 'Cb': 11, 
  };
  const diatonicLetters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const diatonicPitchClasses: Record<string, number> = {
    'C': 0,
    'D': 2,
    'E': 4,
    'F': 5,
    'G': 7,
    'A': 9,
    'B': 11
  };
  // Type 으로 # 인지 b 인지 구별해서 피치 클래스 만들기
  const majorIntervals:number[] = [0, 2, 4, 5, 7, 9, 11];
  const naturalMinorIntervals:number[] = [0, 2, 3, 5, 7, 8, 10];

  function getNote(BaseKey:string, intervals:number, beforeKey: string = ''):string {
    const baseKeys: Record<number, string> = {
      0:'B#/C/', 1:'C#//Db', 2:'/D/', 3:'D#//Eb', 4:'/E/Fb',
      5:'E#/F/', 6:'F#//Gb', 7:'/G/', 8:'G#//Ab', 9:'/A/',
      10:'A#//Bb', 11:'/B/Cb'
    };
    let baseNote:number = chromaticPitchClasses[BaseKey];
    const idx = (baseNote + intervals) % 12;
    const split = baseKeys[idx].split('/');
    let key:string = '';
    if(keyInfo.type === KeySignType.sharp && 
      (beforeKey.length < 1 || !split[0].includes(beforeKey))){
      key = split[0];
    } else if(keyInfo.type === KeySignType.flat &&
      (beforeKey.length < 1 || !split[2].includes(beforeKey))){
      key = split[2];
    }

    if(key.length < 1){
      key = split[1];
    }

    return key;
  }

  const results:DiatonicNote[] = [];

  let isMinor:boolean = keyInfo.key.includes("m");
  let BaseKey:string = keyInfo.key.replace("m", "");
  
  // 기본 다이어토닉 노트 이름
  let letters:string[] = [];
  let Before:string='';
  if(isMinor){
    for(const interval of naturalMinorIntervals){
      Before = getNote(BaseKey, interval, Before)
      letters.push(Before)
      Before = Before.replace('#','').replace('b','');
    }
  } else {
    for(const interval of majorIntervals){
      Before = getNote(BaseKey, interval, Before)
      letters.push(Before)
      Before = Before.replace('#','').replace('b','');
    }
  }

  for(let i = 0; i < midiNotes.length; i++){
    const pitchClass = midiNotes[i] % 12;

    // 다이어토닉 노트 후보군 찾기
    // 예: 피치 클래스 3은 D#/Eb에 해당
    let candidates: DiatonicNote[] = [];
    if(option){
      let numb = option[i];
      let isFlat = numb.includes('b');
      let isSharp = numb.includes('#');
      if(isFlat) {
        numb = numb.replace('b','');
      }
      if(isSharp) {
        numb = numb.replace('#','');
      }
      let noteIdx = Number.parseInt(numb, 8) - 1;
      const regex = /^([A-G])(#|b)?$/;
      const match = regex.exec(letters[noteIdx]);
      if (match) {
        const letter = match[1];
        let accidental = match[2] ? match[2] : '';
        if(isSharp){
          if (accidental === '') accidental = '#';
          else if (accidental === '#') accidental = '##';
          else if (accidental === 'b') accidental = '';
          else if (accidental === 'bb') accidental = 'b';
        }
        if(isFlat){
          if (accidental === '') accidental = 'b';
          else if (accidental === '#') accidental = '';
          else if (accidental === '##') accidental = '#';
          else if (accidental === 'b') accidental = 'bb';
        }
        const basePitchClass = diatonicPitchClasses[letter];
        const pitchDifference = (pitchClass - basePitchClass);
        let octave = Math.floor((midiNotes[i] + pitchDifference)/12) - 1;
        if (calculatePitchClass(basePitchClass, accidental) === pitchClass) {
          candidates.push({ letter, accidental, octave});
        }
      }
    } else {
      // 모든 다이어토닉 음을 확인하며 후보 찾기
      for (const letter of diatonicLetters) {
        const basePitchClass = diatonicPitchClasses[letter];
        // 기본 변경 확인 (조표에 의한)
        let baseAccidental = '';
        if (keyInfo.alterations[letter]) {
          baseAccidental = keyInfo.alterations[letter];
        }
        
        // 기본 피치 클래스 계산
        let alteredPitchClass = calculatePitchClass(basePitchClass, baseAccidental);
        
        // 목표 피치 클래스와 비교하여 필요한 추가 변경 결정
        if (alteredPitchClass === pitchClass) {
          const pitchDifference = (pitchClass - basePitchClass);
          let octave = Math.floor((midiNotes[i] + pitchDifference)/12) - 1;
          // 정확히 일치하는 경우
          candidates.push({ letter, accidental: baseAccidental, octave });
        }
        else {
          // 추가 변경이 필요한 경우
          const pitchDifference = (pitchClass - alteredPitchClass + 12) % 12;
          let octave = Math.floor((midiNotes[i] - pitchClass + alteredPitchClass)/12) - 1;
          
          if (pitchDifference <= 1) {
            // 샵/더블샵 으로 도달 가능
            let accidental = baseAccidental;
            
            if (pitchDifference === 1) {
              // 한 단계 올림
              if (accidental === '') accidental = '#';
              else if (accidental === '#') accidental = '##';
              else if (accidental === 'b') accidental = '';
              else if (accidental === 'bb') accidental = 'b';
            }
            
            // 계산된 피치 클래스 확인
            if (calculatePitchClass(basePitchClass, accidental) === pitchClass) {
              candidates.push({ letter, accidental, octave});
            }
          }

          // 내림으로도 도달 가능한지 확인
          const pitchDifferenceDown = (alteredPitchClass - pitchClass + 12) % 12;
          octave = Math.floor((midiNotes[i] - alteredPitchClass + pitchClass)/12) - 1;
          
          if (pitchDifferenceDown <= 1) {
            // 플랫/더블플랫으로 도달 가능
            let accidental = baseAccidental;
            
            if (pitchDifferenceDown === 1) {
              // 한 단계 내림
              if (accidental === '') accidental = 'b';
              else if (accidental === '#') accidental = '';
              else if (accidental === '##') accidental = '#';
              else if (accidental === 'b') accidental = 'bb';
            }
            
            // 계산된 피치 클래스 확인
            if (calculatePitchClass(basePitchClass, accidental) === pitchClass) {
              candidates.push({ letter, accidental, octave});
            }
          }
        }
      }
    }

    // 후보가 없는 경우 (이론적으로는 발생하지 않음)
    if (candidates.length === 0) {
      console.log("후보 없음")
      const fallbackLetter = chromaticNotes[pitchClass];
      let octave = Math.floor(midiNotes[i]/12) - 1;
      results.push({ letter: fallbackLetter, accidental: '', octave:octave });
      continue;
    }
  
    // 음계에 존재하는 음이 있다면 반환
    let finded = candidates.find(a => letters.includes(a.letter+a.accidental))
    if(finded){
      results.push(finded);
      continue;
    }
  
    let baseIndex:number;
    if(i > 0){
      const diff = midiNotes[i] - midiNotes[i-1];
      // 음계 순서중 아래 음표와의 거리에 따른 현재 음표 부터 우선순위
      baseIndex = (chromaticNotes.indexOf(results[i-1].letter) + diff) % 7;
    } else {
      // 음계에 존재하는 음이 없다면 음계 순서로 우선순위
      baseIndex = chromaticNotes.indexOf(BaseKey);
    }
    const reorderedLetters = [
      ...chromaticNotes.slice(baseIndex),
      ...chromaticNotes.slice(0, baseIndex)
    ];

    candidates.sort((a, b) => sortCandidate(a,b,reorderedLetters));
    
    results.push(candidates[0]);
  }

  return results;
};

// 기본 피치 클래스와 변형으로부터 실제 피치 클래스 계산
const calculatePitchClass = (basePitchClass: number, accidental: string): number => {
  let offset = 0;
  
  if (accidental === '#') offset = 1;
  else if (accidental === '##') offset = 2;
  else if (accidental === 'b') offset = -1;
  else if (accidental === 'bb') offset = -2;
  
  return (basePitchClass + offset + 12) % 12;
};

// 임시표 없는 게 더 높은 순위
const sortCandidate = (a: DiatonicNote, b: DiatonicNote, reorderedLetters:string[]): number => {
  const aA = pointAccidental(a.accidental);
  const bA = pointAccidental(b.accidental);
  if(aA !== bA){ return bA - aA; }
  const aLetter = a.letter;
  const bLetter = b.letter;
  return reorderedLetters.indexOf(aLetter) - reorderedLetters.indexOf(bLetter);
};

const pointAccidental = (accidental:string):number => {
  let offset = 0;
  
  if (accidental === '#') offset = 1;
  else if (accidental === '##') offset = 3;
  else if (accidental === 'b') offset = 2;
  else if (accidental === 'bb') offset = 4;

  return 4 - offset;
}

export { StaffNotation, Harmony, Scale };