import React, { useEffect, useState } from "react"
import BlackHoleEngine from "../../components/util/SpaceLib/BlackHoleEngine.tsx"

const BlackHole = () => {
    return (
        <div className="container mx-auto p-4">
            <BlackHoleEngine></BlackHoleEngine>
        </div>
    )
}

export {BlackHole}