import { Fn, screenCoordinate, select, float, vec3, dot } from "three/tsl";

interface DitherParams {
    colorNode: any;
    bias?: any; // optional: shifts overall brightness of the dither, default 0
    dotSize?: any; // optional: shifts overall brightness of the dither, default 0
    [key: string]: any;
}

// classic 4x4 Bayer matrix, normalized to 0..1
const BAYER_4X4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(
    (v) => (v + 0.5) / 16,
);

export const dither = Fn(
    ({ colorNode, bias = 0.0, dotSize = 4.0 }: DitherParams) => {
        const x = screenCoordinate.x.mod(dotSize).floor();
        const y = screenCoordinate.y.mod(dotSize).floor();

        // build the per-pixel threshold from the 4x4 table
        let bayerValue: any = float(BAYER_4X4[0]);
        for (let i = 1; i < 16; i++) {
            const bx = i % 4;
            const by = Math.floor(i / 4);
            bayerValue = select(
                x.equal(bx).and(y.equal(by)),
                float(BAYER_4X4[i]),
                bayerValue,
            );
        }

        const isRWhite = colorNode.r.add(bias).greaterThan(bayerValue);
        const isGWhite = colorNode.g.add(bias).greaterThan(bayerValue);
        const isBWhite = colorNode.b.add(bias).greaterThan(bayerValue);

        return vec3(
            select(isRWhite, 1.0, 0.0),
            select(isGWhite, 1.0, 0.0),
            select(isBWhite, 1.0, 0.0),
        );
    },
);
