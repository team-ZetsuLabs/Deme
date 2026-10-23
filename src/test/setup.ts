import { configure } from '@testing-library/react';

// findBy… attend 1 s par défaut : trop court pour un écran chargé à la demande sur une CI lente.
configure({ asyncUtilTimeout: 3000 });
