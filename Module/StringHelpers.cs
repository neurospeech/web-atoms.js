using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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
