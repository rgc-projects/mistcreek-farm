(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MistWalk = api;
})(globalThis, function () {
  'use strict';
  const keyboard = 135, route = 116, tile = 24;

  // The engine and save file keep integer tile positions. Only the renderer samples this track.
  function create() {
    const pose = {x: 0, y: 0, dir: 'down', phase: null};
    let fromX, fromY, dx, dy, started, until = -Infinity, distance = 0;
    function reset(player) {
      until = -Infinity;
      distance = 0;
      return sample(player, 0, true);
    }
    function start(from, to, now, duration) {
      dx = to.x - from.x; dy = to.y - from.y;
      if (Math.abs(dx) + Math.abs(dy) !== 1) { reset(to); return; }
      if (now - until > 45) distance = 0;
      fromX = from.x; fromY = from.y;
      started = now; until = now + duration;
      distance = (distance + 1) % 2;
    }
    function active(now) { return now < until; }
    function sample(player, now, reduced = false) {
      pose.dir = player.dir;
      if (reduced || !active(now)) {
        pose.x = player.x; pose.y = player.y; pose.phase = null;
      } else {
        const f = Math.max(0, (now - started) / (until - started));
        pose.x = fromX + dx * f; pose.y = fromY + dy * f;
        pose.phase = Math.PI * (1 - distance + f);
      }
      return pose;
    }
    return {start, reset, active, sample};
  }
  return {create, keyboard, route, tile};
});
