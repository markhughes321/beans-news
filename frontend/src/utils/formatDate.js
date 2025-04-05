export const formatDate = (dateString) => {
  const dateOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Date(dateString).toLocaleDateString('en-GB', dateOptions);
};