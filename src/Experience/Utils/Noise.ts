import {
    Fn,
    vec4,
    vec3,
    mod,
    floor,
    fract,
    dot,
    abs,
    step,
    clamp,
    max,
    float,
} from "three/tsl";

const permute: any = Fn(([x]: any) => {
    return mod(x.mul(34.0).add(1.0).mul(x), 289.0);
});

const taylorInvSqrt: any = Fn(([r]: any) => {
    return r.mul(-0.85373472095314).add(1.79284291400159);
});

const grad4: any = Fn(([j, ip]: any) => {
    const ones = vec4(1.0, 1.0, 1.0, -1.0);

    let p_xyz = floor(fract(vec3(j).mul(ip.xyz)).mul(7.0))
        .mul(ip.zwy)
        .sub(1.0);
    const p_w = float(1.5).sub(dot(abs(p_xyz), ones.xyz));
    const p = vec4(p_xyz, p_w);

    const s: any = step(0.0, p.negate());

    p_xyz = p.xyz.add(s.xyz.mul(2.0).sub(1.0).mul(s.www));
    return vec4(p_xyz, p.w);
});

export const simplexNoise4D: any = Fn(([v]: any) => {
    const F4 = 0.309016994374947451;
    const G4 = 0.138196601125010504;

    const i: any = floor(v.add(dot(v, vec4(F4))));

    const x0: any = v.sub(i).add(dot(i, vec4(G4)));

    const isX: any = step(x0.yzw, x0.xxx);
    const isYZ: any = step(x0.zww, x0.yyz);

    const i0x = isX.x.add(isX.y).add(isX.z);
    const i0yzw: any = float(1.0).sub(isX);

    const i0y = i0yzw.x.add(isYZ.x).add(isYZ.y);
    const i0zw: any = float(1.0).sub(isYZ.xy).add(i0yzw.yz);

    const i0z = i0zw.x.add(isYZ.z);
    const i0w = i0zw.y.add(float(1.0).sub(isYZ.z));

    const i0 = vec4(i0x, i0y, i0z, i0w);

    const i3 = clamp(i0, 0.0, 1.0);
    const i2 = clamp(i0.sub(1.0), 0.0, 1.0);
    const i1 = clamp(i0.sub(2.0), 0.0, 1.0);

    const x1 = x0.sub(i1).add(G4);
    const x2 = x0.sub(i2).add(G4 * 2.0);
    const x3 = x0.sub(i3).add(G4 * 3.0);
    const x4 = x0.sub(1.0).add(G4 * 4.0);

    const ii: any = mod(i, 289.0);

    const j0: any = permute(
        permute(
            permute(
                permute(vec4(0.0, i1.w, i2.w, i3.w).add(ii.w)).add(
                    vec4(0.0, i1.z, i2.z, i3.z).add(ii.z),
                ),
            ).add(vec4(0.0, i1.y, i2.y, i3.y).add(ii.y)),
        ).add(vec4(0.0, i1.x, i2.x, i3.x).add(ii.x)),
    );

    const j1_w: any = permute(
        permute(
            permute(permute(ii.w.add(1.0)).add(ii.z.add(1.0))).add(
                ii.y.add(1.0),
            ),
        ).add(ii.x.add(1.0)),
    );

    const ip = vec4(1.0 / 294.0, 1.0 / 49.0, 1.0 / 7.0, 0.0);
    const p0: any = grad4(j0.x, ip);
    const p1: any = grad4(j0.y, ip);
    const p2: any = grad4(j0.z, ip);
    const p3: any = grad4(j0.w, ip);
    const p4: any = grad4(j1_w, ip);

    const norm: any = taylorInvSqrt(
        vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)),
    );

    const p0_norm = p0.mul(norm.x);
    const p1_norm = p1.mul(norm.y);
    const p2_norm = p2.mul(norm.z);
    const p3_norm = p3.mul(norm.w);

    const norm_p4 = taylorInvSqrt(dot(p4, p4));
    const p4_norm = p4.mul(norm_p4);

    const m0 = max(
        float(0.6).sub(
            vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)),
        ),
        0.0,
    );
    const m0_2 = m0.mul(m0);
    const m0_4 = m0_2.mul(m0_2);

    const m1 = max(float(0.6).sub(dot(x4, x4)), 0.0);
    const m1_2 = m1.mul(m1);
    const m1_4 = m1_2.mul(m1_2);

    const g0 = vec4(
        dot(p0_norm, x0),
        dot(p1_norm, x1),
        dot(p2_norm, x2),
        dot(p3_norm, x3),
    );
    const g1 = dot(p4_norm, x4);

    const result = float(49.0).mul(dot(m0_4, g0).add(m1_4.mul(g1)));
    return result.mul(0.5).add(0.5);
});
