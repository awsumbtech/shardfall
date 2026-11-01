"use strict";

// One job: the Kenmi prop sheet rows. The next island adds rows here.
// Pixels stay in the private art repo. This file is only paths and rectangles.
(function () {
  var SF = window.SF || {};
  window.SF = SF;
  SF.PROP_ROWS = [
  {
    "id": "tree_oak",
    "file": "vendor/kenmi/Cute_Fantasy/Trees/Big_Oak_Tree.png",
    "rect": [
      64,
      0,
      64,
      80
    ],
    "anchor": [
      32,
      63
    ],
    "canopy": true,
    "flip": true
  },
  {
    "id": "tree_broad",
    "file": "vendor/kenmi/Cute_Fantasy/Trees/Big_Oak_Tree.png",
    "rect": [
      64,
      0,
      64,
      80
    ],
    "anchor": [
      32,
      63
    ],
    "canopy": true,
    "flip": true
  },
  {
    "id": "tree_oak_b",
    "file": "vendor/kenmi/Cute_Fantasy/Trees/Medium_Oak_Tree.png",
    "rect": [
      32,
      0,
      32,
      48
    ],
    "anchor": [
      16,
      31
    ],
    "canopy": true,
    "flip": true
  },
  {
    "id": "tree_broad_b",
    "file": "vendor/kenmi/Cute_Fantasy/Trees/Medium_Oak_Tree.png",
    "rect": [
      32,
      0,
      32,
      48
    ],
    "anchor": [
      16,
      31
    ],
    "canopy": true,
    "flip": true
  },
  {
    "id": "tree_pine",
    "file": "vendor/kenmi/Cute_Fantasy/Trees/Big_Spruce_tree.png",
    "rect": [
      64,
      0,
      64,
      80
    ],
    "anchor": [
      32,
      63
    ],
    "canopy": true,
    "flip": true
  },
  {
    "id": "tree_pine_b",
    "file": "vendor/kenmi/Cute_Fantasy/Trees/Medium_Spruce_Tree.png",
    "rect": [
      32,
      0,
      32,
      48
    ],
    "anchor": [
      16,
      31
    ],
    "canopy": true,
    "flip": true
  },
  {
    "id": "tree_birch",
    "file": "vendor/kenmi/Cute_Fantasy/Trees/Big_Fruit_Tree.png",
    "rect": [
      32,
      0,
      32,
      64
    ],
    "anchor": [
      15,
      47
    ],
    "canopy": true,
    "flip": true
  },
  {
    "id": "tree_birch_b",
    "file": "vendor/kenmi/Cute_Fantasy/Trees/Medium_Fruit_Tree.png",
    "rect": [
      32,
      0,
      32,
      64
    ],
    "anchor": [
      15,
      47
    ],
    "canopy": true,
    "flip": true
  },
  {
    "id": "tree_apple",
    "file": "vendor/kenmi/Cute_Fantasy/Crops/Apple_Tree.png",
    "rect": [
      0,
      0,
      32,
      64
    ],
    "anchor": [
      15,
      47
    ],
    "canopy": true
  },
  {
    "id": "bush",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      80,
      80,
      16,
      16
    ],
    "anchor": [
      8,
      14
    ],
    "flip": true
  },
  {
    "id": "bush_b",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      80,
      144,
      16,
      16
    ],
    "anchor": [
      8,
      14
    ],
    "flip": true
  },
  {
    "id": "bush_c",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      48,
      144,
      16,
      16
    ],
    "anchor": [
      8,
      14
    ],
    "flip": true
  },
  {
    "id": "bush_d",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      96,
      144,
      16,
      16
    ],
    "anchor": [
      8,
      14
    ],
    "flip": true
  },
  {
    "id": "bush_e",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      112,
      144,
      16,
      16
    ],
    "anchor": [
      8,
      14
    ],
    "flip": true
  },
  {
    "id": "rock",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      96,
      96,
      16,
      16
    ],
    "anchor": [
      8,
      13
    ],
    "flip": true
  },
  {
    "id": "rock_b",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      48,
      96,
      16,
      16
    ],
    "anchor": [
      8,
      13
    ],
    "flip": true
  },
  {
    "id": "rock_c",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      64,
      96,
      16,
      16
    ],
    "anchor": [
      8,
      13
    ],
    "flip": true
  },
  {
    "id": "rock_moss_sm",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      0,
      80,
      16,
      16
    ],
    "anchor": [
      8,
      13
    ],
    "flip": true
  },
  {
    "id": "rock_moss_sm_b",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      16,
      80,
      16,
      16
    ],
    "anchor": [
      8,
      13
    ],
    "flip": true
  },
  {
    "id": "pebble",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      112,
      96,
      16,
      16
    ],
    "anchor": [
      8,
      13
    ],
    "flip": true
  },
  {
    "id": "rock_cluster",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      128,
      96,
      16,
      16
    ],
    "anchor": [
      8,
      13
    ],
    "flip": true
  },
  {
    "id": "rock_round",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      64,
      144,
      16,
      16
    ],
    "anchor": [
      8,
      13
    ],
    "flip": true
  },
  {
    "id": "boulder",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      64,
      176,
      32,
      32
    ],
    "anchor": [
      16,
      28
    ],
    "flip": true
  },
  {
    "id": "stump",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      16,
      96,
      16,
      16
    ],
    "anchor": [
      8,
      13
    ]
  },
  {
    "id": "stump_b",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      32,
      144,
      16,
      16
    ],
    "anchor": [
      8,
      13
    ]
  },
  {
    "id": "log",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      64,
      112,
      32,
      16
    ],
    "anchor": [
      16,
      13
    ],
    "flip": true
  },
  {
    "id": "log_b",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      0,
      112,
      32,
      16
    ],
    "anchor": [
      16,
      13
    ],
    "flip": true
  },
  {
    "id": "tuft",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      32,
      32,
      16,
      16
    ],
    "anchor": [
      8,
      13
    ],
    "flip": true
  },
  {
    "id": "tuft_b",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      0,
      32,
      16,
      16
    ],
    "anchor": [
      8,
      13
    ],
    "flip": true
  },
  {
    "id": "tuft_c",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      16,
      32,
      16,
      16
    ],
    "anchor": [
      8,
      13
    ],
    "flip": true
  },
  {
    "id": "tuft_bloom",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      96,
      32,
      16,
      16
    ],
    "anchor": [
      8,
      13
    ],
    "flip": true
  },
  {
    "id": "flower",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      48,
      16,
      16,
      16
    ],
    "anchor": [
      8,
      12
    ],
    "flip": true
  },
  {
    "id": "flower_gold",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      48,
      32,
      16,
      16
    ],
    "anchor": [
      8,
      12
    ],
    "flip": true
  },
  {
    "id": "flower_tide",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      0,
      0,
      16,
      16
    ],
    "anchor": [
      8,
      12
    ],
    "flip": true
  },
  {
    "id": "flower_tide_b",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      16,
      0,
      16,
      16
    ],
    "anchor": [
      8,
      12
    ],
    "flip": true
  },
  {
    "id": "flower_tide_c",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      32,
      0,
      16,
      16
    ],
    "anchor": [
      8,
      12
    ],
    "flip": true
  },
  {
    "id": "blossom",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      48,
      0,
      16,
      16
    ],
    "anchor": [
      8,
      12
    ],
    "flip": true
  },
  {
    "id": "daisy",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      64,
      0,
      16,
      16
    ],
    "anchor": [
      8,
      12
    ],
    "flip": true
  },
  {
    "id": "daisy_b",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      80,
      0,
      16,
      16
    ],
    "anchor": [
      8,
      12
    ],
    "flip": true
  },
  {
    "id": "flower_white",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      16,
      16,
      16,
      16
    ],
    "anchor": [
      8,
      12
    ],
    "flip": true
  },
  {
    "id": "flower_white_b",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      32,
      16,
      16,
      16
    ],
    "anchor": [
      8,
      12
    ],
    "flip": true
  },
  {
    "id": "flower_pink",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      64,
      16,
      16,
      16
    ],
    "anchor": [
      8,
      12
    ],
    "flip": true
  },
  {
    "id": "flower_pink_b",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      80,
      16,
      16,
      16
    ],
    "anchor": [
      8,
      12
    ],
    "flip": true
  },
  {
    "id": "flower_gold_b",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      64,
      32,
      16,
      16
    ],
    "anchor": [
      8,
      12
    ],
    "flip": true
  },
  {
    "id": "flower_gold_c",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      80,
      32,
      16,
      16
    ],
    "anchor": [
      8,
      12
    ],
    "flip": true
  },
  {
    "id": "bud_red",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      96,
      16,
      16,
      16
    ],
    "anchor": [
      8,
      12
    ]
  },
  {
    "id": "bud_purple",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      112,
      16,
      16,
      16
    ],
    "anchor": [
      8,
      12
    ]
  },
  {
    "id": "bud_blue",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      128,
      16,
      16,
      16
    ],
    "anchor": [
      8,
      12
    ]
  },
  {
    "id": "fern",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      96,
      32,
      16,
      16
    ],
    "anchor": [
      8,
      13
    ],
    "flip": true
  },
  {
    "id": "fern_b",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      96,
      48,
      16,
      16
    ],
    "anchor": [
      8,
      13
    ],
    "flip": true
  },
  {
    "id": "mushroom_tan",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      112,
      32,
      16,
      16
    ],
    "anchor": [
      8,
      13
    ],
    "flip": true
  },
  {
    "id": "mushroom_tan_sm",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      128,
      32,
      16,
      16
    ],
    "anchor": [
      8,
      13
    ],
    "flip": true
  },
  {
    "id": "mushroom_red",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      0,
      48,
      16,
      16
    ],
    "anchor": [
      8,
      12
    ]
  },
  {
    "id": "mushroom_purple",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      16,
      48,
      16,
      16
    ],
    "anchor": [
      8,
      12
    ]
  },
  {
    "id": "mushroom_blue",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      32,
      48,
      16,
      16
    ],
    "anchor": [
      8,
      12
    ]
  },
  {
    "id": "mushroom_tiny_red",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      0,
      64,
      16,
      16
    ],
    "anchor": [
      8,
      10
    ]
  },
  {
    "id": "mushroom_tiny_purple",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      16,
      64,
      16,
      16
    ],
    "anchor": [
      8,
      10
    ]
  },
  {
    "id": "mushroom_pair",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Outdoor_Decor.png",
    "rect": [
      32,
      80,
      16,
      16
    ],
    "anchor": [
      8,
      12
    ],
    "flip": true
  },
  {
    "id": "wild_red",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Flowers.png",
    "rect": [
      0,
      64,
      16,
      16
    ],
    "anchor": [
      8,
      14
    ],
    "flip": true
  },
  {
    "id": "wild_pink",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Flowers.png",
    "rect": [
      32,
      64,
      16,
      16
    ],
    "anchor": [
      8,
      14
    ],
    "flip": true
  },
  {
    "id": "wild_violet",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Flowers.png",
    "rect": [
      48,
      64,
      16,
      16
    ],
    "anchor": [
      8,
      14
    ],
    "flip": true
  },
  {
    "id": "wild_gold",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Flowers.png",
    "rect": [
      32,
      80,
      16,
      16
    ],
    "anchor": [
      8,
      14
    ],
    "flip": true
  },
  {
    "id": "wild_blue",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Flowers.png",
    "rect": [
      64,
      80,
      16,
      16
    ],
    "anchor": [
      8,
      14
    ],
    "flip": true
  },
  {
    "id": "wild_pair_red",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Flowers.png",
    "rect": [
      0,
      96,
      16,
      16
    ],
    "anchor": [
      8,
      14
    ],
    "flip": true
  },
  {
    "id": "wild_pair_pink",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Flowers.png",
    "rect": [
      32,
      96,
      16,
      16
    ],
    "anchor": [
      8,
      14
    ],
    "flip": true
  },
  {
    "id": "wild_pair_violet",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Flowers.png",
    "rect": [
      48,
      96,
      16,
      16
    ],
    "anchor": [
      8,
      14
    ],
    "flip": true
  },
  {
    "id": "wild_pair_gold",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Flowers.png",
    "rect": [
      32,
      112,
      16,
      16
    ],
    "anchor": [
      8,
      14
    ],
    "flip": true
  },
  {
    "id": "wild_pair_blue",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Flowers.png",
    "rect": [
      64,
      112,
      16,
      16
    ],
    "anchor": [
      8,
      14
    ],
    "flip": true
  },
  {
    "id": "cottage",
    "file": "vendor/kenmi/Cute_Fantasy/Buildings/Buildings/Houses/Wood/House_1_Wood_Base_Red.png",
    "rect": [
      0,
      0,
      96,
      128
    ],
    "anchor": [
      48,
      112
    ],
    "smoke": [
      20,
      -92
    ]
  },
  {
    "id": "lamp_lit",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Lanter_Posts.png",
    "rect": [
      0,
      144,
      16,
      48
    ],
    "anchor": [
      8,
      46
    ],
    "frames": 6,
    "dx": 16,
    "rate": 6
  },
  {
    "id": "lamp_cold",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Lanter_Posts.png",
    "rect": [
      0,
      144,
      16,
      48
    ],
    "anchor": [
      8,
      46
    ],
    "cold": true
  },
  {
    "id": "chest",
    "file": "vendor/kenmi/Cute_Fantasy/Buildings/House_Decor/Chest_Anim.png",
    "rect": [
      0,
      0,
      16,
      16
    ],
    "anchor": [
      8,
      13
    ],
    "frames": 4,
    "dx": 16
  },
  {
    "id": "chest_open",
    "file": "vendor/kenmi/Cute_Fantasy/Buildings/House_Decor/Chest_Anim.png",
    "rect": [
      48,
      0,
      16,
      16
    ],
    "anchor": [
      8,
      13
    ]
  },
  {
    "id": "fence",
    "file": "vendor/kenmi/Cute_Fantasy/Outdoor decoration/Fences.png",
    "rect": [
      0,
      0,
      16,
      62
    ],
    "anchor": [
      8,
      62
    ]
  },
  {
    "id": "smoke",
    "file": "vendor/kenmi/Cute_Fantasy/Buildings/House_Decor/Chimney_smoke_Anim.png",
    "rect": [
      0,
      0,
      32,
      32
    ],
    "anchor": [
      16,
      20
    ],
    "frames": 5,
    "dx": 32,
    "rate": 6
  }
];
})();
