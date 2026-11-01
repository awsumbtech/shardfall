"use strict";

// EnemyAI is the current foe script, unchanged. Every third turn is a skill
// from the foe's list. Otherwise it attacks. The target is whoever in the
// party has the lowest HP percent. turnCount advances when the foe commits,
// because the rotation is counted in that same step.
var SF = window.SF || {};
window.SF = SF;

SF.EnemyAI = {
  choose: function (b, actor) {
    var skills = actor.skills || [];
    var pick = null;
    if (skills.length && (b.turnCount + actor.index) % 3 === 2) {
      pick = skills[(b.turnCount + actor.index) % skills.length];
    }
    var target = SF.BattleState.living(b, "party").slice().sort(function (a, c) {
      return a.hp / a.maxHp - c.hp / c.maxHp;
    })[0];
    b.turnCount += 1;
    if (pick) return { type: "skill", skillId: pick, targetId: target ? target.id : null };
    return { type: "skill", skillId: "attack", targetId: target ? target.id : null };
  }
};
