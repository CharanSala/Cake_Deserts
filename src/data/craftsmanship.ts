export interface RecipeStage {
  step: string;
  action: string;
  title: string;
  caption: string;
}

export const RECIPE_STAGES: RecipeStage[] = [
  {
    step: '01',
    action: 'Measure',
    title: 'Raw Origin Ingredients',
    caption: 'Single-estate cacao, Normandy butter, flour & hazelnuts.',
  },
  {
    step: '02',
    action: 'Whisk',
    title: 'Silky Ganache Batter',
    caption: 'Slow-emulsified dark chocolate in a warm copper bowl.',
  },
  {
    step: '03',
    action: 'Bake',
    title: 'Three Sponge Tiers',
    caption: 'Warm cocoa sponge layers stacked onto marble.',
  },
  {
    step: '04',
    action: 'Glaze',
    title: 'Chantilly & Mirror Drip',
    caption: 'Rose buttercream layers crowned with mirror chocolate.',
  },
  {
    step: '05',
    action: 'Serve',
    title: 'The Final Éclat',
    caption: 'Hand-curled chocolate ribbons & 24k gold leaf.',
  },
];
