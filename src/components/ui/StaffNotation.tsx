import React, { ReactNode, useMemo } from "react";

interface Harmony {
    roman: string; 
    notes: number[]; 
    degree: number;
}
interface NotationProps {
  harmony: Harmony[];
  keySignature: string;
  scale: string;
}

const StaffNotation: React.FC<NotationProps> = ({ harmony, keySignature, scale }) => {
  // SVG 크기 및 여백 설정
  const svgWidth = 900;
  const svgHeight = 200;
  const margin = { top: 20, right: 25, bottom: 20, left: 25 };
  
  // 오선 간격 및 위치 계산
  const staffLineSpacing = 12; // 오선 간격
  const staffWidth = svgWidth - margin.left - margin.right;
  const staffYPosition = margin.top + 50; // 오선 시작 Y 위치
  
  // 조표 및 음자리표 위치
  const clefX = margin.left + 5;
  const keySignatureX = clefX + 34;
  
  // 화성 데이터가 없으면 기본 오선만 보여줌
  if (!harmony || harmony.length === 0) {
    return (
      <svg width={svgWidth} height={svgHeight}>
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
  
  // 화성 위치 계산
  const chordWidth = staffWidth / (harmony.length + 1);

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
  const renderKeySignature = () => {
    // 조표 계산 (간단한 구현)
    const sharpKeys = ['G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
    const flatKeys = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
    
    const baseKey = keySignature.charAt(0);
    const isSharp = keySignature.includes('#') || sharpKeys.find(k => k === keySignature);
    const isFlat = keySignature.includes('b') || flatKeys.find(k => k === keySignature);
    
    let accidentalCount = 0;
    
    if (isSharp) {
      accidentalCount = sharpKeys.findIndex(k => k === keySignature) + 1;
      if (accidentalCount === 0 && keySignature !== 'C') {
        // 커스텀 샵 조표 처리
        accidentalCount = 1;
      }
    } else if (isFlat) {
      accidentalCount = flatKeys.findIndex(k => k === keySignature) + 1;
      if (accidentalCount === 0 && keySignature !== 'C') {
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
        y = staffYPosition + (pos.line * staffLineSpacing / 2) + pos.offset + 2;
        
        accidentals.push(
          <text key={`sharp-${i}`} x={x} y={y} fontSize="24" fontFamily="serif">♯</text>
        );
      } else if (isFlat) {
        const pos = flatPositions[i];
        y = staffYPosition + (pos.line * staffLineSpacing / 2) + pos.offset;
        
        accidentals.push(
          <text key={`flat-${i}`} x={x} y={y} fontSize="24" fontFamily="serif">♭</text>
        );
      }
    }
    return accidentals;
  };

  // 음표 렌더링 부분에서 임시표 추가하기
  const renderNote = (midiNote: number, noteIdx:number, index:number, chordX: number, keySignature: string) => {
    const diatonicNote = midiToDiatonic(midiNote, keySignature);
    // 다이어토닉 노트 위치 계산 (C, D, E, F, G, A, B)
    const diatonicIndex = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].indexOf(diatonicNote.letter);
    // G4 = 67 (MIDI 노트 번호)를 기준으로 계산
    const G4Position = staffYPosition + 3 * staffLineSpacing;
    // 옥타브 차이 계산 (한 옥타브당 3.5줄 차이)
    const octaveDiff = (diatonicNote.octave - 4) * 7 * (staffLineSpacing / 2);
    // 다이아토닉 노트 위치 차이 계산
    // G(4)부터 시작해서 C(0), D(1)... 순서로 오선 위로 올라감
    const noteDiff = (diatonicIndex - 4) * (staffLineSpacing / 2);
    const noteY =  G4Position - octaveDiff - noteDiff;
    console.log(`${diatonicNote.letter}${diatonicNote.octave}`)
    
    return (
      <g key={`note-${index}-${noteIdx}`}>
        {/* 필요한 경우 가로줄 추가 */}
        {renderLedgerLines(noteY, chordX)}
        
        {/* 음표 (원으로 표시) */}
        <ellipse
          cx={chordX}
          cy={noteY}
          rx={8}
          ry={6}
          transform={`rotate(-20, ${chordX}, ${noteY})`}
          fill="black"
        />
        
        {/* 임시표 표시 - 조표에 없는 임시표만 표시 */}
        {renderAccidental(diatonicNote, chordX, noteY, keySignature)}
      </g>
    );
  };
  
  // 임시표 렌더링 함수
  const renderAccidental = (note: DiatonicNote, x: number, y: number, keySignature: string) => {
    // 조표 정보 가져오기
    const keyInfo = getKeySignatureInfo(keySignature);
    
    // 조표에 포함된 변형인지 확인
    const keyAlteration = keyInfo.alterations[note.letter] || '';
    
    // 노트의 변형이 조표와 다를 때만 임시표 표시
    if (note.accidental !== keyAlteration) {
      const accidentalX = x - 20;
      const accidentalSymbol = getAccidentalSymbol(note.accidental);
      
      return (
        <text
          x={accidentalX}
          y={y + 8}
          fontSize="24"
          fontFamily="serif"
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
    <svg width={svgWidth} height={svgHeight}>
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
      {renderKeySignature()}
      
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
              {chord.roman}
            </text>
            
            {/* 화음 구성음 그리기 */}
            {chord.notes.map((midiNote, noteIdx) => {              
              return renderNote(midiNote, noteIdx, index, chordX, keySignature);
            })}
          </g>
        );
      })
    }
    </svg>
  );
};

// 모든 가능한 조표 유형과 해당 음계의 변형을 정의
interface KeySignatureInfo {
  key: string;         // 조표 (예: 'C', 'F#', 'Bb')
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
const midiToDiatonic = (midiNote: number, keySignature: string): DiatonicNote => {
  // 피치 클래스 (0-11)와 옥타브 계산
  const pitchClass = midiNote % 12;
  const octave = Math.floor(midiNote / 12) - 1; // MIDI C0은 12임
  
  // 조표 분석하여 각 음의 변형 정보 가져오기
  const keyInfo = getKeySignatureInfo(keySignature);
  
  // 다이어토닉 스케일의 음 결정
  const diatonicNote = determineDiatonicNote(pitchClass, keyInfo);
  
  return {
    ...diatonicNote,
    octave
  };
};

// 조표 정보를 분석하는 함수
const getKeySignatureInfo = (keySignature: string): KeySignatureInfo => {
  // 모든 가능한 키에 대한 변형 정보
  const keySignatures: { [key: string]: KeySignatureInfo } = {
    // 자연 조성
    'C': { key: 'C', alterations: {} },
    
    // 샵 조성들
    'G': { key: 'G', alterations: { 'F': '#' } },
    'D': { key: 'D', alterations: { 'F': '#', 'C': '#' } },
    'A': { key: 'A', alterations: { 'F': '#', 'C': '#', 'G': '#' } },
    'E': { key: 'E', alterations: { 'F': '#', 'C': '#', 'G': '#', 'D': '#' } },
    'B': { key: 'B', alterations: { 'F': '#', 'C': '#', 'G': '#', 'D': '#', 'A': '#' } },
    'F#': { key: 'F#', alterations: { 'F': '#', 'C': '#', 'G': '#', 'D': '#', 'A': '#', 'E': '#' } },
    'C#': { key: 'C#', alterations: { 'F': '#', 'C': '#', 'G': '#', 'D': '#', 'A': '#', 'E': '#', 'B': '#' } },
    
    // 플랫 조성들
    'F': { key: 'F', alterations: { 'B': 'b' } },
    'Bb': { key: 'Bb', alterations: { 'B': 'b', 'E': 'b' } },
    'Eb': { key: 'Eb', alterations: { 'B': 'b', 'E': 'b', 'A': 'b' } },
    'Ab': { key: 'Ab', alterations: { 'B': 'b', 'E': 'b', 'A': 'b', 'D': 'b' } },
    'Db': { key: 'Db', alterations: { 'B': 'b', 'E': 'b', 'A': 'b', 'D': 'b', 'G': 'b' } },
    'Gb': { key: 'Gb', alterations: { 'B': 'b', 'E': 'b', 'A': 'b', 'D': 'b', 'G': 'b', 'C': 'b' } },
    'Cb': { key: 'Cb', alterations: { 'B': 'b', 'E': 'b', 'A': 'b', 'D': 'b', 'G': 'b', 'C': 'b', 'F': 'b' } },
    
    // 더블 샵 조성 (이론적 조성)
    'G#': { key: 'G#', alterations: { 'F': '#', 'C': '#', 'G': '#', 'D': '#', 'A': '#', 'E': '#', 'B': '#', 'F#': '#' } },
    'D#': { key: 'D#', alterations: { 'F': '#', 'C': '#', 'G': '#', 'D': '#', 'A': '#', 'E': '#', 'B': '#', 'F#': '#', 'C#': '#' } },
    'A#': { key: 'A#', alterations: { 'F': '#', 'C': '#', 'G': '#', 'D': '#', 'A': '#', 'E': '#', 'B': '#', 'F#': '#', 'C#': '#', 'G#': '#' } },
    
    // 더블 플랫 조성 (이론적 조성)
    'Fb': { key: 'Fb', alterations: { 'B': 'b', 'E': 'b', 'A': 'b', 'D': 'b', 'G': 'b', 'C': 'b', 'F': 'b', 'Bb': 'b' } },
    'Bbb': { key: 'Bbb', alterations: { 'B': 'b', 'E': 'b', 'A': 'b', 'D': 'b', 'G': 'b', 'C': 'b', 'F': 'b', 'Bb': 'b', 'Eb': 'b' } }
  };
  
  // 주어진 조표가 기존 정의에 없는 경우, 가장 가까운 조표 정보를 사용
  if (!keySignatures[keySignature]) {
    console.warn(`Unknown key signature: ${keySignature}. Using C major/A minor.`);
    return keySignatures['C'];
  }
  
  return keySignatures[keySignature];
};

// 주어진 피치 클래스와 조표 정보를 바탕으로 다이어토닉 노트 결정
const determineDiatonicNote = (pitchClass: number, keyInfo: KeySignatureInfo): Omit<DiatonicNote, 'octave'> => {
  // 기본 다이어토닉 노트 이름 (C 메이저 기준)
  const diatonicLetters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  
  // 각 다이어토닉 노트의 기본 피치 클래스 (C 메이저 기준)
  const diatonicPitchClasses = {
    'C': 0,
    'D': 2,
    'E': 4,
    'F': 5,
    'G': 7,
    'A': 9,
    'B': 11
  };
  
  // 다이어토닉 노트 후보군 찾기
  // 예: 피치 클래스 3은 D#/Eb에 해당
  let candidates: Omit<DiatonicNote, 'octave'>[] = [];
  
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
      // 정확히 일치하는 경우
      candidates.push({ letter, accidental: baseAccidental });
    } 
    // else {
    //   // 추가 변경이 필요한 경우
    //   const pitchDifference = (pitchClass - alteredPitchClass + 12) % 12;
      
    //   if (pitchDifference <= 1) {
    //     // 샵/더블샵 으로 도달 가능
    //     let accidental = baseAccidental;
        
    //     if (pitchDifference === 1) {
    //       // 한 단계 올림
    //       if (accidental === '') accidental = '#';
    //       else if (accidental === '#') accidental = '##';
    //       else if (accidental === 'b') accidental = '';
    //       else if (accidental === 'bb') accidental = 'b';
    //     }
        
    //     // 계산된 피치 클래스 확인
    //     if (calculatePitchClass(basePitchClass, accidental) === pitchClass) {
    //       candidates.push({ letter, accidental });
    //     }
    //   }
      
    //   // 내림으로도 도달 가능한지 확인
    //   const pitchDifferenceDown = (alteredPitchClass - pitchClass + 12) % 12;
      
    //   if (pitchDifferenceDown <= 1) {
    //     // 플랫/더블플랫으로 도달 가능
    //     let accidental = baseAccidental;
        
    //     if (pitchDifferenceDown === 1) {
    //       // 한 단계 내림
    //       if (accidental === '') accidental = 'b';
    //       else if (accidental === '#') accidental = '';
    //       else if (accidental === '##') accidental = '#';
    //       else if (accidental === 'b') accidental = 'bb';
    //     }
        
    //     // 계산된 피치 클래스 확인
    //     if (calculatePitchClass(basePitchClass, accidental) === pitchClass) {
    //       candidates.push({ letter, accidental });
    //     }
    //   }
    // }
  }
  
  // 후보가 없는 경우 (이론적으로는 발생하지 않음)
  if (candidates.length === 0) {
    const chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const fallbackLetter = chromaticNotes[pitchClass];
    return { letter: fallbackLetter, accidental: '' };
  }
  
  // 무조건 조표 우선으로 변경
  candidates.sort((a, b) => {
    // 조표에 표시된 변형 우선
    const aLetter = a.letter;
    const bLetter = b.letter;
    
    // 다이어토닉 스케일은 알파벳 순서로 C,D,E,F,G,A,B만 사용
    // F(5)와 E#(4+1)가 같은 음높이라도 E를 우선 선택
    // 조표를 우선하되, 같은 다이어토닉 위치의 노트를 먼저 선택
    
    // 다이어토닉 위치 우선 순위
    const letterOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    return letterOrder.indexOf(aLetter) - letterOrder.indexOf(bLetter);
  });
  
  return candidates[0];
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

// 예시: MIDI 값으로 범위 C3(48)~C5(72)의 모든 값을 다이어토닉 변환
const generateDiatonicTable = (keySignature: string): { midi: number, note: DiatonicNote }[] => {
  const result:{ midi: number; note: DiatonicNote; }[] = [];
  
  for (let midi = 48; midi <= 72; midi++) {
    const diatonicNote = midiToDiatonic(midi, keySignature);
    result.push({ midi, note: diatonicNote });
  }
  
  return result;
};

export { StaffNotation, Harmony };