    uniform vec2 resolution;
    uniform vec2 chunkPos;
    uniform float chunkSize;

    vec2 random_vector(float ix, float iy) {
        int n = int(ix) * 374761393 + int(iy) * 668265263;
        n = (n ^ (n >> 13)) * 1274126177;
        float angle = float(n & 0xFFFF) / 65536.0 * 6.2831853;
        return vec2(cos(angle), sin(angle));
    }

    // Fade curve
    float fade(float t) {
        return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
    }

    // Linear interpolation
    float lerp(float a, float b, float t) {
        return a + t * (b - a);
    }

    // Dot product of gradient with distance vector
    float dotGridGradient(float ix, float iy, float x, float y) {
        vec2 grad = random_vector(ix, iy);
        float dx = x - ix;
        float dy = y - iy;
        return dx * grad.x + dy * grad.y;
    }

    // Final Perlin noise function, returns -1..1
    float perlin_get(float x, float y) {
        // Cell coordinates
        float x0 = floor(x);
        float x1 = x0 + 1.0;
        float y0 = floor(y);
        float y1 = y0 + 1.0;

        // Local coords inside cell
        float sx = x - x0;
        float sy = y - y0;

        // Dot products
        float n0 = dotGridGradient(x0, y0, x, y);
        float n1 = dotGridGradient(x1, y0, x, y);
        float ix0 = lerp(n0, n1, fade(sx));

        n0 = dotGridGradient(x0, y1, x, y);
        n1 = dotGridGradient(x1, y1, x, y);
        float ix1 = lerp(n0, n1, fade(sx));

        return lerp(ix0, ix1, fade(sy));
    }

    float getTerrainHeightAt(float x, float y) {
        float scale = 0.01;

        float n = perlin_get(x * scale, y * scale);

        return n;
    }

    void main() {
        vec2 uv = (gl_FragCoord.xy / resolution.xy + chunkPos) * chunkSize;
        float n = getTerrainHeightAt(uv.x, uv.y);

        // remap from -1, 1 to 0, 1
        n = n * 0.5 + 0.5;

        gl_FragColor = vec4(n * 10.0, 0.0, 0.0, 1.0);
    }