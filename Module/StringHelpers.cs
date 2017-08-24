using System;

namespace Atoms.Web
{
    public static class StringHelpers
    {

        public static bool EqualsIgnoreCase(this string a, string b)
        {
            if (String.IsNullOrWhiteSpace(a))
            {
                return String.IsNullOrWhiteSpace(b);
            }

            return String.Equals(a, b, StringComparison.OrdinalIgnoreCase);
        }

    }
}
