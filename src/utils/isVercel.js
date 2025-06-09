/**
 * Verifica se o ambiente atual é o Vercel
 */

export const isVercel = () => {
  return process.env.VERCEL === '1' || 
         process.env.VERCEL_ENV || 
         process.env.NOW_REGION || 
         process.env.VERCEL_REGION;
};

export const isServerless = () => {
  return isVercel() || process.env.AWS_LAMBDA_FUNCTION_NAME;
};

export default isVercel; 