using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations.Schema;

namespace TodoApi.Models
{
        [Table("listsmemberships", Schema = "todoapp")]
        public class ListMembership
        {
            public int Id { get; set; }
            public int listId { get; set; }
            public int userId { get; set; }

    }
}
